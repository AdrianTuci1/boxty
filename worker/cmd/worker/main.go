package main

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"sync"
	"syscall"
	"time"

	"github.com/boxty/worker/internal/cloud"
	"github.com/boxty/worker/internal/cronjob"
	"github.com/boxty/worker/internal/imagebuilder"
	"github.com/boxty/worker/internal/sandbox"
	"github.com/boxty/worker/internal/scheduler"
	"github.com/boxty/worker/internal/secrets"
	"github.com/boxty/worker/internal/tunnel"
	"github.com/gorilla/mux"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	apiURL := os.Getenv("API_URL")
	if apiURL == "" {
		apiURL = "http://localhost:3000"
	}
	workerKey := os.Getenv("WORKER_API_KEY")
	if workerKey == "" {
		workerKey = "dev-key"
	}
	region := os.Getenv("REGION")
	if region == "" {
		region = "us-east-1"
	}
	provider := os.Getenv("PROVIDER")
	if provider == "" {
		provider = "aws"
	}

	sched := scheduler.NewLocal()
	mgr := sandbox.NewManager(sched)
	reg := cloud.NewRegistrar(apiURL, workerKey, region, provider)

	if err := reg.Register(context.Background()); err != nil {
		slog.Error("failed to register worker", "err", err)
	}

	go reg.HeartbeatLoop(context.Background(), 5*time.Second)

	idleStop := make(chan struct{})
	go idleDetector(mgr, idleStop)

	metricsStop := make(chan struct{})
	go metricsCollector(mgr, apiURL, workerKey, metricsStop)

	r := mux.NewRouter()
	r.HandleFunc("/sandboxes", handleStartSandbox(mgr)).Methods("POST")
	r.HandleFunc("/sandboxes/{id}", handleStopSandbox(mgr)).Methods("DELETE")
	r.HandleFunc("/sandboxes/{id}/exec", handleExec(mgr)).Methods("POST")
	r.HandleFunc("/sandboxes/{id}/snapshot", handleSnapshot(mgr)).Methods("POST")
	r.HandleFunc("/sandboxes/restore", handleRestore(mgr)).Methods("POST")
	r.HandleFunc("/sandboxes/{id}", handleGetSandbox(mgr)).Methods("GET")
	r.HandleFunc("/health", handleHealth(mgr)).Methods("GET")

	apiSrv := &http.Server{Addr: ":9001", Handler: r}

	wsMux := http.NewServeMux()
	wsMux.HandleFunc("/", tunnel.WebSocketHandler(mgr))
	wsSrv := &http.Server{Addr: ":9002", Handler: wsMux}

	tcpProxy := tunnel.NewTCPProxy(mgr)

	bldMux := mux.NewRouter()
	bldMux.HandleFunc("/images/build", imagebuilder.HandleBuild()).Methods("POST")
	bldMux.HandleFunc("/images/{imageId}/status", imagebuilder.HandleStatus()).Methods("GET")
	builderSrv := &http.Server{Addr: ":9004", Handler: bldMux}

	var wg sync.WaitGroup
	wg.Add(4)
	go func() {
		defer wg.Done()
		slog.Info("API server listening", "port", 9001)
		if err := apiSrv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("API server error", "err", err)
		}
	}()
	go func() {
		defer wg.Done()
		slog.Info("WebSocket server listening", "port", 9002)
		if err := wsSrv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("WebSocket server error", "err", err)
		}
	}()
	go func() {
		defer wg.Done()
		slog.Info("TCP proxy listening", "port", 9003)
		if err := tcpProxy.ListenAndServe(":9003"); err != nil {
			slog.Error("TCP proxy error", "err", err)
		}
	}()
	go func() {
		defer wg.Done()
		slog.Info("Image builder listening", "port", 9004)
		if err := builderSrv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("Builder server error", "err", err)
		}
	}()

	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGTERM, syscall.SIGINT)
	<-sigCh

	slog.Info("shutting down gracefully")
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := mgr.SnapshotAll(shutdownCtx); err != nil {
		slog.Error("snapshot all failed", "err", err)
	}

	close(idleStop)
	close(metricsStop)

	_ = apiSrv.Shutdown(shutdownCtx)
	_ = wsSrv.Shutdown(shutdownCtx)
	_ = builderSrv.Shutdown(shutdownCtx)
	_ = tcpProxy.Shutdown(shutdownCtx)

	wg.Wait()
	slog.Info("shutdown complete")
}

func handleStartSandbox(mgr *sandbox.Manager) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			SandboxID  string           `json:"sandboxId"`
			Image      string           `json:"image"`
			CPU        float64          `json:"cpu"`
			Memory     int64            `json:"memory"`
			GPU        bool             `json:"gpu"`
			Timeout    int              `json:"timeout"`
			TunnelKey  string           `json:"tunnelKey"`
			Secrets    []secrets.Secret `json:"secrets"`
			DiskSizeGb int              `json:"diskSizeGb"`
			Volume     *sandbox.Volume  `json:"volume,omitempty"`
			Schedule   bool             `json:"schedule"`
			Cmd        []string         `json:"cmd,omitempty"`
			ScheduleID string           `json:"scheduleId,omitempty"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		ctx := r.Context()
		sb, err := mgr.Create(ctx, sandbox.CreateOpts{
			ID:         req.SandboxID,
			Image:      req.Image,
			CPU:        req.CPU,
			Memory:     req.Memory,
			GPU:        req.GPU,
			Timeout:    req.Timeout,
			TunnelKey:  req.TunnelKey,
			Secrets:    req.Secrets,
			DiskSizeGb: req.DiskSizeGb,
			Volume:     req.Volume,
		})
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		if req.Schedule {
			go cronjob.Run(context.Background(), mgr, sb.ID, req.Cmd, req.ScheduleID, req.Timeout)
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(sb)
	}
}

func handleStopSandbox(mgr *sandbox.Manager) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		id := vars["id"]
		if err := mgr.Stop(r.Context(), id); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusNoContent)
	}
}

func handleExec(mgr *sandbox.Manager) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		id := vars["id"]
		var req struct {
			Cmd     []string `json:"cmd"`
			Timeout int      `json:"timeout"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		out, err := mgr.Exec(r.Context(), id, req.Cmd, req.Timeout)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]string{"output": out})
	}
}

func handleSnapshot(mgr *sandbox.Manager) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		id := vars["id"]
		key, err := mgr.Snapshot(r.Context(), id)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]string{"snapshotKey": key})
	}
}

func handleRestore(mgr *sandbox.Manager) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			SandboxID   string           `json:"sandboxId"`
			SnapshotKey string           `json:"snapshotKey"`
			Image       string           `json:"image"`
			CPU         float64          `json:"cpu"`
			Memory      int64            `json:"memory"`
			GPU         bool             `json:"gpu"`
			Secrets     []secrets.Secret `json:"secrets"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		sb, err := mgr.Restore(r.Context(), req.SandboxID, req.SnapshotKey, sandbox.CreateOpts{
			Image:   req.Image,
			CPU:     req.CPU,
			Memory:  req.Memory,
			GPU:     req.GPU,
			Secrets: req.Secrets,
		})
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(sb)
	}
}

func handleGetSandbox(mgr *sandbox.Manager) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		id := vars["id"]
		sb, err := mgr.Get(id)
		if err != nil {
			http.Error(w, err.Error(), http.StatusNotFound)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(sb)
	}
}

func handleHealth(mgr *sandbox.Manager) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"status":    "ok",
			"uptime":    time.Since(startTime).Seconds(),
			"sandboxes": mgr.Count(),
			"capacity":  mgr.Capacity(),
		})
	}
}

var startTime = time.Now()

func idleDetector(mgr *sandbox.Manager, stop <-chan struct{}) {
	ticker := time.NewTicker(10 * time.Second)
	defer ticker.Stop()
	for {
		select {
		case <-ticker.C:
			mgr.CheckIdle(300 * time.Second)
		case <-stop:
			return
		}
	}
}

func metricsCollector(mgr *sandbox.Manager, apiURL, key string, stop <-chan struct{}) {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()
	for {
		select {
		case <-ticker.C:
			mgr.CollectAndReport(apiURL, key)
		case <-stop:
			return
		}
	}
}
