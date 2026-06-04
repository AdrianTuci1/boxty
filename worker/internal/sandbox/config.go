package sandbox

import (
	"fmt"
	"os"
	"path/filepath"
)

// Volume represents a persistent volume mount
type Volume struct {
	Name      string `json:"name"`
	MountPath string `json:"mountPath"`
}

// SandboxConfig holds the runsc configuration for a sandbox
type SandboxConfig struct {
	ID         string
	Image      string
	CPU        float64
	Memory     int64
	GPU        bool
	Env        []string
	DiskSizeGb int
	Volume     *Volume
	WorkDir    string
}

// BuildConfig creates a runsc config JSON path and returns the path.
func BuildConfig(cfg *SandboxConfig) (string, error) {
	workDir := cfg.WorkDir
	if workDir == "" {
		workDir = filepath.Join("/tmp", "boxty", cfg.ID)
	}
	if err := os.MkdirAll(workDir, 0755); err != nil {
		return "", fmt.Errorf("mkdir workdir: %w", err)
	}
	configPath := filepath.Join(workDir, "config.json")
	// Minimal OCI runtime spec for runsc
	spec := fmt.Sprintf(`{
  "ociVersion": "1.0.2-dev",
  "process": {
    "terminal": false,
    "user": { "uid": 0, "gid": 0 },
    "args": ["/bin/sh", "-c", "while true; do sleep 1; done"],
    "env": %s,
    "cwd": "/"
  },
  "root": {
    "path": "rootfs",
    "readonly": false
  },
  "linux": {
    "resources": {
      "cpu": { "shares": %d },
      "memory": { "limit": %d }
    },
    "namespaces": [
      {"type": "pid"},
      {"type": "network"},
      {"type": "ipc"},
      {"type": "uts"},
      {"type": "mount"}
    ]
  }
}`, envJSON(cfg.Env), cpuShares(cfg.CPU), cfg.Memory*1024*1024)

	if err := os.WriteFile(configPath, []byte(spec), 0644); err != nil {
		return "", fmt.Errorf("write config: %w", err)
	}
	return configPath, nil
}

func envJSON(env []string) string {
	out := "["
	for i, e := range env {
		if i > 0 {
			out += ","
		}
		out += fmt.Sprintf("%q", e)
	}
	out += "]"
	return out
}

func cpuShares(cpu float64) int {
	shares := int(cpu * 1024)
	if shares < 2 {
		shares = 2
	}
	return shares
}
