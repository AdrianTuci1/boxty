package route

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"sync"
	"time"
)

// Entry maps a sandbox to a worker host + exposed ports.
type Entry struct {
	SandboxID  string   `json:"sandbox_id"`
	WorkerID   string   `json:"worker_id"`
	WorkerHost string   `json:"worker_host"`
	Ports      []int    `json:"ports"`
	Status     string   `json:"status"` // running, stopped
	UpdatedAt  int64    `json:"updated_at"`
}

// Resolver caches sandbox→worker routes and resolves cache misses via the API server.
type Resolver struct {
	mu      sync.RWMutex
	cache   map[string]*Entry // sandboxID → Entry
	apiURL  string
	client  *http.Client
}

// NewResolver creates a new route resolver.
func NewResolver(apiURL string) *Resolver {
	return &Resolver{
		cache:  make(map[string]*Entry),
		apiURL: apiURL,
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// Upsert adds or updates a route in the cache.
func (r *Resolver) Upsert(entry Entry) {
	r.mu.Lock()
	defer r.mu.Unlock()
	entry.UpdatedAt = time.Now().Unix()
	r.cache[entry.SandboxID] = &entry
	slog.Info("route upserted", "sandbox", entry.SandboxID, "worker", entry.WorkerHost, "status", entry.Status)
}

// Remove deletes a route from the cache.
func (r *Resolver) Remove(sandboxID string) {
	r.mu.Lock()
	defer r.mu.Unlock()
	delete(r.cache, sandboxID)
	slog.Info("route removed", "sandbox", sandboxID)
}

// Resolve returns the worker host for a sandbox. Falls back to API on cache miss or stopped sandbox.
func (r *Resolver) Resolve(sandboxID string) (*Entry, error) {
	// Check cache first
	r.mu.RLock()
	entry, ok := r.cache[sandboxID]
	r.mu.RUnlock()

	if ok && entry.Status == "running" {
		return entry, nil
	}

	// Cache miss or stopped: ask API server (which handles cold start)
	return r.fetchFromAPI(sandboxID)
}

func (r *Resolver) fetchFromAPI(sandboxID string) (*Entry, error) {
	url := fmt.Sprintf("%s/internal/route/%s", r.apiURL, sandboxID)
	resp, err := r.client.Get(url)
	if err != nil {
		return nil, fmt.Errorf("route lookup failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusNotFound {
		return nil, fmt.Errorf("sandbox %s not found", sandboxID)
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("route lookup: unexpected status %d", resp.StatusCode)
	}

	var entry Entry
	if err := json.NewDecoder(resp.Body).Decode(&entry); err != nil {
		return nil, fmt.Errorf("decode route: %w", err)
	}

	// Cache it
	r.mu.Lock()
	entry.UpdatedAt = time.Now().Unix()
	r.cache[sandboxID] = &entry
	r.mu.Unlock()

	return &entry, nil
}

// GetCacheStats returns cache size for health checks.
func (r *Resolver) GetCacheStats() map[string]int {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return map[string]int{
		"cached_routes": len(r.cache),
	}
}
