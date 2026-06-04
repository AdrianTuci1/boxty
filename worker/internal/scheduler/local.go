package scheduler

import (
	"runtime"
	"sync"
)

// Local tracks local capacity and does simple bin packing.
type Local struct {
	mu        sync.RWMutex
	cpuTotal  float64
	cpuUsed   float64
	memTotal  int64
	memUsed   int64
	gpuTotal  int
	gpuUsed   int
}

// NewLocal creates a new local scheduler.
func NewLocal() *Local {
	return &Local{
		cpuTotal: float64(runtime.NumCPU()),
		memTotal: 16 * 1024, // MB
		gpuTotal: 0,
	}
}

// Allocate reserves resources.
func (l *Local) Allocate(cpu float64, memory int64, gpu bool) {
	l.mu.Lock()
	defer l.mu.Unlock()
	l.cpuUsed += cpu
	l.memUsed += memory
	if gpu {
		l.gpuUsed++
	}
}

// Release frees resources.
func (l *Local) Release(cpu float64, memory int64, gpu bool) {
	l.mu.Lock()
	defer l.mu.Unlock()
	l.cpuUsed -= cpu
	if l.cpuUsed < 0 {
		l.cpuUsed = 0
	}
	l.memUsed -= memory
	if l.memUsed < 0 {
		l.memUsed = 0
	}
	if gpu {
		l.gpuUsed--
		if l.gpuUsed < 0 {
			l.gpuUsed = 0
		}
	}
}

// Capacity returns remaining capacity.
func (l *Local) Capacity() map[string]interface{} {
	l.mu.RLock()
	defer l.mu.RUnlock()
	return map[string]interface{}{
		"cpu_total":     l.cpuTotal,
		"cpu_used":      l.cpuUsed,
		"cpu_available": l.cpuTotal - l.cpuUsed,
		"mem_total_mb":  l.memTotal,
		"mem_used_mb":   l.memUsed,
		"mem_avail_mb":  l.memTotal - l.memUsed,
		"gpu_total":     l.gpuTotal,
		"gpu_used":      l.gpuUsed,
		"gpu_avail":     l.gpuTotal - l.gpuUsed,
	}
}
