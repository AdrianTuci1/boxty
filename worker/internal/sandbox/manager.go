package sandbox

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"sync"
	"time"

	"github.com/boxty/worker/internal/scheduler"
	"github.com/boxty/worker/internal/secrets"
	"github.com/boxty/worker/internal/snapshot"
)

// Sandbox represents a running sandbox
type Sandbox struct {
	ID         string    `json:"id"`
	Image      string    `json:"image"`
	Status     string    `json:"status"`
	CreatedAt  time.Time `json:"createdAt"`
	UpdatedAt  time.Time `json:"updatedAt"`
	CPU        float64   `json:"cpu"`
	Memory     int64     `json:"memory"`
	GPU        bool      `json:"gpu"`
	WorkDir    string    `json:"-"`
	LastActive time.Time `json:"-"`
}

// CreateOpts holds options for creating a sandbox
type CreateOpts struct {
	ID         string
	Image      string
	CPU        float64
	Memory     int64
	GPU        bool
	Timeout    int
	TunnelKey  string
	Secrets    []secrets.Secret
	DiskSizeGb int
	Volume     *Volume
}

// Manager manages sandbox lifecycle
type Manager struct {
	mu        sync.RWMutex
	sandboxes map[string]*Sandbox
	sched     *scheduler.Local
}

// NewManager creates a new sandbox manager.
func NewManager(sched *scheduler.Local) *Manager {
	return &Manager{
		sandboxes: make(map[string]*Sandbox),
		sched:     sched,
	}
}

// Create starts a new sandbox via runsc.
func (m *Manager) Create(ctx context.Context, opts CreateOpts) (*Sandbox, error) {
	m.mu.Lock()
	defer m.mu.Unlock()

	if _, exists := m.sandboxes[opts.ID]; exists {
		return nil, fmt.Errorf("sandbox %s already exists", opts.ID)
	}

	workDir := filepath.Join("/tmp", "boxty", opts.ID)
	if err := os.MkdirAll(workDir, 0755); err != nil {
		return nil, fmt.Errorf("mkdir: %w", err)
	}

	env := []string{"PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"}
	env = secrets.Inject(env, opts.Secrets)

	cfg := &SandboxConfig{
		ID:         opts.ID,
		Image:      opts.Image,
		CPU:        opts.CPU,
		Memory:     opts.Memory,
		GPU:        opts.GPU,
		Env:        env,
		DiskSizeGb: opts.DiskSizeGb,
		Volume:     opts.Volume,
		WorkDir:    workDir,
	}

	_, err := BuildConfig(cfg)
	if err != nil {
		return nil, fmt.Errorf("build config: %w", err)
	}

	// Write .env file for secrets (cleaned up on stop)
	if len(opts.Secrets) > 0 {
		if err := secrets.WriteEnvFile(workDir, opts.Secrets); err != nil {
			return nil, fmt.Errorf("write env: %w", err)
		}
	}

	cmd := exec.CommandContext(ctx, "runsc", "--rootless", "run", "-d", "-b", workDir, opts.ID)
	cmd.Dir = workDir
	cmd.Env = append(os.Environ(), env...)
	if out, err := cmd.CombinedOutput(); err != nil {
		slog.Error("runsc run failed", "output", string(out), "err", err)
		return nil, fmt.Errorf("runsc run: %w", err)
	}

	sb := &Sandbox{
		ID:         opts.ID,
		Image:      opts.Image,
		Status:     "running",
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
		CPU:        opts.CPU,
		Memory:     opts.Memory,
		GPU:        opts.GPU,
		WorkDir:    workDir,
		LastActive: time.Now(),
	}
	m.sandboxes[opts.ID] = sb
	m.sched.Allocate(opts.CPU, opts.Memory, opts.GPU)

	// Timeout watcher
	if opts.Timeout > 0 {
		go func(id string, timeout int) {
			time.Sleep(time.Duration(timeout) * time.Second)
			_ = m.Stop(context.Background(), id)
		}(opts.ID, opts.Timeout)
	}

	slog.Info("sandbox created", "id", opts.ID)
	return sb, nil
}

// Stop stops and deletes a sandbox.
func (m *Manager) Stop(ctx context.Context, id string) error {
	m.mu.Lock()
	sb, ok := m.sandboxes[id]
	if !ok {
		m.mu.Unlock()
		return fmt.Errorf("sandbox %s not found", id)
	}
	delete(m.sandboxes, id)
	m.mu.Unlock()

	_ = exec.CommandContext(ctx, "runsc", "kill", id, "SIGTERM").Run()
	time.Sleep(2 * time.Second)
	_ = exec.CommandContext(ctx, "runsc", "delete", id).Run()

	secrets.Cleanup(sb.WorkDir)
	_ = os.RemoveAll(sb.WorkDir)

	m.sched.Release(sb.CPU, sb.Memory, sb.GPU)
	slog.Info("sandbox stopped", "id", id)
	return nil
}

// Exec runs a command inside a sandbox.
func (m *Manager) Exec(ctx context.Context, id string, cmd []string, timeout int) (string, error) {
	m.mu.RLock()
	_, ok := m.sandboxes[id]
	m.mu.RUnlock()
	if !ok {
		return "", fmt.Errorf("sandbox %s not found", id)
	}

	if timeout <= 0 {
		timeout = 60
	}
	ctx, cancel := context.WithTimeout(ctx, time.Duration(timeout)*time.Second)
	defer cancel()

	args := append([]string{"exec", id}, cmd...)
	c := exec.CommandContext(ctx, "runsc", args...)
	out, err := c.CombinedOutput()
	if err != nil {
		return string(out), fmt.Errorf("exec: %w", err)
	}
	m.touch(id)
	return string(out), nil
}

// Snapshot checkpoints a sandbox and uploads to S3.
func (m *Manager) Snapshot(ctx context.Context, id string) (string, error) {
	m.mu.RLock()
	sb, ok := m.sandboxes[id]
	m.mu.RUnlock()
	if !ok {
		return "", fmt.Errorf("sandbox %s not found", id)
	}

	key := fmt.Sprintf("boxty-snapshots/%s/snapshot-%d.tar.gz", id, time.Now().Unix())
	if err := snapshot.Checkpoint(ctx, id, sb.WorkDir, key); err != nil {
		return "", fmt.Errorf("checkpoint: %w", err)
	}
	return key, nil
}

// Restore restores a sandbox from S3 snapshot.
func (m *Manager) Restore(ctx context.Context, id, snapshotKey string, opts CreateOpts) (*Sandbox, error) {
	workDir := filepath.Join("/tmp", "boxty", id)
	if err := os.MkdirAll(workDir, 0755); err != nil {
		return nil, fmt.Errorf("mkdir: %w", err)
	}
	if err := snapshot.Restore(ctx, id, snapshotKey, workDir); err != nil {
		return nil, fmt.Errorf("restore: %w", err)
	}

	sb := &Sandbox{
		ID:         id,
		Image:      opts.Image,
		Status:     "running",
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
		CPU:        opts.CPU,
		Memory:     opts.Memory,
		GPU:        opts.GPU,
		WorkDir:    workDir,
		LastActive: time.Now(),
	}
	m.mu.Lock()
	m.sandboxes[id] = sb
	m.mu.Unlock()
	m.sched.Allocate(opts.CPU, opts.Memory, opts.GPU)
	return sb, nil
}

// Get returns a sandbox by ID.
func (m *Manager) Get(id string) (*Sandbox, error) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	sb, ok := m.sandboxes[id]
	if !ok {
		return nil, fmt.Errorf("sandbox %s not found", id)
	}
	return sb, nil
}

// Count returns the number of active sandboxes.
func (m *Manager) Count() int {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return len(m.sandboxes)
}

// Capacity returns remaining capacity.
func (m *Manager) Capacity() map[string]interface{} {
	return m.sched.Capacity()
}

// SnapshotAll snapshots all active sandboxes (graceful shutdown).
func (m *Manager) SnapshotAll(ctx context.Context) error {
	m.mu.RLock()
	ids := make([]string, 0, len(m.sandboxes))
	for id := range m.sandboxes {
		ids = append(ids, id)
	}
	m.mu.RUnlock()
	for _, id := range ids {
		if _, err := m.Snapshot(ctx, id); err != nil {
			slog.Error("snapshot failed", "id", id, "err", err)
		}
	}
	return nil
}

// CheckIdle snapshots and stops idle sandboxes.
func (m *Manager) CheckIdle(threshold time.Duration) {
	m.mu.RLock()
	var idle []string
	for id, sb := range m.sandboxes {
		if time.Since(sb.LastActive) > threshold {
			idle = append(idle, id)
		}
	}
	m.mu.RUnlock()
	for _, id := range idle {
		slog.Info("sandbox idle, snapshotting", "id", id)
		ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
		_, _ = m.Snapshot(ctx, id)
		cancel()
		_ = m.Stop(context.Background(), id)
	}
}

// CollectAndReport collects metrics and reports to API.
func (m *Manager) CollectAndReport(apiURL, key string) {
	m.mu.RLock()
	list := make([]*Sandbox, 0, len(m.sandboxes))
	for _, sb := range m.sandboxes {
		list = append(list, sb)
	}
	m.mu.RUnlock()

	for _, sb := range list {
		metrics := collectMetrics(sb)
		body, _ := json.Marshal(metrics)
		req, _ := http.NewRequest("POST", apiURL+"/api/sandboxes/"+sb.ID+"/metrics", bytes.NewReader(body))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("X-API-Key", key)
		resp, err := http.DefaultClient.Do(req)
		if err != nil {
			slog.Error("metrics report failed", "id", sb.ID, "err", err)
			continue
		}
		resp.Body.Close()
	}
}

func collectMetrics(sb *Sandbox) map[string]interface{} {
	return map[string]interface{}{
		"cpu_pct":          0.0,
		"memory_mb":        sb.Memory,
		"network_rx_bytes": 0,
		"network_tx_bytes": 0,
		"gpu_util_pct":     0.0,
		"gpu_memory_mb":    0,
	}
}

func (m *Manager) touch(id string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	if sb, ok := m.sandboxes[id]; ok {
		sb.LastActive = time.Now()
	}
}
