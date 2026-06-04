package route

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"sync"
	"testing"
)

func TestResolverUpsertAndResolve(t *testing.T) {
	r := NewResolver("http://localhost:3000")
	r.Upsert(Entry{
		SandboxID:  "sb-1",
		WorkerHost: "10.0.0.1",
		Status:     "running",
	})

	e, err := r.Resolve("sb-1")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if e.WorkerHost != "10.0.0.1" {
		t.Errorf("WorkerHost = %q, want %q", e.WorkerHost, "10.0.0.1")
	}
}

func TestResolverResolveStoppedFallsBackToAPI(t *testing.T) {
	r := NewResolver("http://localhost:3000")
	r.Upsert(Entry{
		SandboxID:  "sb-stopped",
		WorkerHost: "10.0.0.1",
		Status:     "stopped",
	})

	_, err := r.Resolve("sb-stopped")
	if err == nil {
		t.Error("expected error when resolving stopped sandbox against unreachable API")
	}
}

func TestResolverResolveCacheMiss(t *testing.T) {
	r := NewResolver("http://localhost:3000")
	_, err := r.Resolve("nonexistent")
	if err == nil {
		t.Error("expected error for cache miss with unreachable API")
	}
}

func TestResolverResolveHitsAPIOnSuccess(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		json.NewEncoder(w).Encode(Entry{
			SandboxID:  "sb-api",
			WorkerHost: "10.0.0.99",
			Status:     "running",
		})
	}))
	defer ts.Close()

	r := NewResolver(ts.URL)
	e, err := r.Resolve("sb-api")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if e.WorkerHost != "10.0.0.99" {
		t.Errorf("WorkerHost = %q, want %q", e.WorkerHost, "10.0.0.99")
	}
}

func TestResolverAPI404(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		w.WriteHeader(http.StatusNotFound)
	}))
	defer ts.Close()

	r := NewResolver(ts.URL)
	_, err := r.Resolve("missing")
	if err == nil {
		t.Error("expected error for 404")
	}
}

func TestResolverRemove(t *testing.T) {
	r := NewResolver("http://localhost:3000")
	r.Upsert(Entry{SandboxID: "sb-2", WorkerHost: "10.0.0.2", Status: "running"})
	r.Remove("sb-2")

	_, err := r.Resolve("sb-2")
	if err == nil {
		t.Error("expected error after remove")
	}
}

func TestResolverCacheStats(t *testing.T) {
	r := NewResolver("http://localhost:3000")
	r.Upsert(Entry{SandboxID: "a", WorkerHost: "h1", Status: "running"})
	r.Upsert(Entry{SandboxID: "b", WorkerHost: "h2", Status: "running"})

	stats := r.GetCacheStats()
	if stats["cached_routes"] != 2 {
		t.Errorf("cached_routes = %d, want 2", stats["cached_routes"])
	}
}

func TestResolverConcurrency(t *testing.T) {
	r := NewResolver("http://localhost:3000")
	var wg sync.WaitGroup
	for i := 0; i < 50; i++ {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			r.Upsert(Entry{SandboxID: "sb", WorkerHost: "host", Status: "running"})
			r.Resolve("sb")
		}(i)
	}
	wg.Wait()

	_, err := r.Resolve("sb")
	if err != nil {
		t.Errorf("final resolve should succeed: %v", err)
	}
}
