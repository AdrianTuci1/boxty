package cloud

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"time"
)

// Registrar handles worker registration and heartbeat.
type Registrar struct {
	apiURL   string
	apiKey   string
	region   string
	provider string
	workerID string
}

// NewRegistrar creates a new registrar.
func NewRegistrar(apiURL, apiKey, region, provider string) *Registrar {
	return &Registrar{
		apiURL:   apiURL,
		apiKey:   apiKey,
		region:   region,
		provider: provider,
		workerID: os.Getenv("HOSTNAME"),
	}
}

// Register registers the worker with the API.
func (r *Registrar) Register(ctx context.Context) error {
	body := map[string]interface{}{
		"workerId": r.workerID,
		"region":   r.region,
		"provider": r.provider,
	}
	b, _ := json.Marshal(body)
	url := fmt.Sprintf("%s/api/workers/register", r.apiURL)
	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewReader(b))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-API-Key", r.apiKey)
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 300 {
		return fmt.Errorf("register failed with status %d", resp.StatusCode)
	}
	return nil
}

// HeartbeatLoop sends heartbeats periodically.
func (r *Registrar) HeartbeatLoop(ctx context.Context, interval time.Duration) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()
	for {
		select {
		case <-ticker.C:
			if err := r.heartbeat(ctx); err != nil {
				slog.Error("heartbeat failed", "err", err)
			}
		case <-ctx.Done():
			return
		}
	}
}

func (r *Registrar) heartbeat(ctx context.Context) error {
	body := map[string]interface{}{
		"cpu": map[string]interface{}{
			"total": 8,
			"used":  3.5,
		},
		"memory": map[string]interface{}{
			"total_gb": 32,
			"used_gb":  12,
		},
		"sandboxes_running": 0,
		"uptime_seconds":    0,
		"region":            r.region,
		"provider":          r.provider,
	}
	b, _ := json.Marshal(body)
	url := fmt.Sprintf("%s/api/workers/%s/heartbeat", r.apiURL, r.workerID)
	req, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewReader(b))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-API-Key", r.apiKey)
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 300 {
		return fmt.Errorf("heartbeat failed with status %d", resp.StatusCode)
	}
	return nil
}
