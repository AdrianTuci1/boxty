package imagebuilder

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"sync"
	"time"

	"github.com/gorilla/mux"
)

// BuildStatus tracks the status of an image build.
type BuildStatus struct {
	ImageID   string `json:"imageId"`
	Status    string `json:"status"`
	ImageURL  string `json:"imageUrl,omitempty"`
	Error     string `json:"error,omitempty"`
	StartedAt time.Time `json:"startedAt"`
}

var (
	buildsMu sync.RWMutex
	builds   = make(map[string]*BuildStatus)
)

// HandleBuild handles POST /images/build.
func HandleBuild() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			ImageID      string            `json:"imageId"`
			BaseImage    string            `json:"base_image"`
			Commands     []string          `json:"commands"`
			Layers       []Layer           `json:"layers,omitempty"`
			RegistryAuth RegistryAuth      `json:"registry_auth"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		status := &BuildStatus{
			ImageID:   req.ImageID,
			Status:    "building",
			StartedAt: time.Now(),
		}
		buildsMu.Lock()
		builds[req.ImageID] = status
		buildsMu.Unlock()

		go doBuild(req.ImageID, req.BaseImage, req.Commands, req.RegistryAuth)

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(status)
	}
}

// HandleStatus handles GET /images/:imageId/status.
func HandleStatus() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		id := vars["imageId"]
		buildsMu.RLock()
		status, ok := builds[id]
		buildsMu.RUnlock()
		if !ok {
			http.Error(w, "not found", http.StatusNotFound)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(status)
	}
}

// Layer represents a build layer.
type Layer struct {
	Type    string `json:"type"`
	Content string `json:"content"`
}

// RegistryAuth holds registry credentials.
type RegistryAuth struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

func doBuild(imageID, baseImage string, commands []string, auth RegistryAuth) {
	workDir := filepath.Join("/tmp", "boxty", "builds", imageID)
	_ = os.MkdirAll(workDir, 0755)

	dockerfile := fmt.Sprintf("FROM %s\n", baseImage)
	for _, cmd := range commands {
		dockerfile += cmd + "\n"
	}
	_ = os.WriteFile(filepath.Join(workDir, "Dockerfile"), []byte(dockerfile), 0644)

	tag := fmt.Sprintf("registry.boxty.dev/%s/%s:latest", auth.Username, imageID)
	cmd := exec.Command("docker", "build", "-t", tag, ".")
	cmd.Dir = workDir
	out, err := cmd.CombinedOutput()
	if err != nil {
		slog.Error("docker build failed", "output", string(out), "err", err)
		updateStatus(imageID, "failed", "", string(out))
		return
	}

	// docker push
	push := exec.Command("docker", "push", tag)
	push.Dir = workDir
	out, err = push.CombinedOutput()
	if err != nil {
		slog.Error("docker push failed", "output", string(out), "err", err)
		updateStatus(imageID, "failed", "", string(out))
		return
	}

	updateStatus(imageID, "done", tag, "")
}

func updateStatus(imageID, status, imageURL, errStr string) {
	buildsMu.Lock()
	defer buildsMu.Unlock()
	if b, ok := builds[imageID]; ok {
		b.Status = status
		b.ImageURL = imageURL
		b.Error = errStr
	}
}
