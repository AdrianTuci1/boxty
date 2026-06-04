package cronjob

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/exec"
	"time"

	"github.com/boxty/worker/internal/sandbox"
)

// Run executes a scheduled command inside a sandbox and reports the result.
func Run(ctx context.Context, mgr *sandbox.Manager, sandboxID string, cmd []string, scheduleID string, timeout int) {
	if timeout <= 0 {
		timeout = 600
	}
	ctx, cancel := context.WithTimeout(ctx, time.Duration(timeout)*time.Second)
	defer cancel()

	start := time.Now()
	c := exec.CommandContext(ctx, "runsc", append([]string{"exec", sandboxID}, cmd...)...)
	var stdout, stderr bytes.Buffer
	c.Stdout = &stdout
	c.Stderr = &stderr

	err := c.Run()
	duration := time.Since(start).Milliseconds()
	exitCode := 0
	if err != nil {
		if exitErr, ok := err.(*exec.ExitError); ok {
			exitCode = exitErr.ExitCode()
		} else {
			exitCode = -1
		}
	}

	apiURL := os.Getenv("API_URL")
	if apiURL == "" {
		apiURL = "http://localhost:3000"
	}
	reportCronResult(apiURL, scheduleID, sandboxID, exitCode, stdout.String(), stderr.String(), duration)

	// Cleanup sandbox after job
	_ = mgr.Stop(context.Background(), sandboxID)
}

func reportCronResult(apiURL, scheduleID, sandboxID string, exitCode int, stdout, stderr string, durationMs int64) {
	body := map[string]interface{}{
		"scheduleId": scheduleID,
		"sandboxId":  sandboxID,
		"exitCode":   exitCode,
		"stdout":     stdout,
		"stderr":     stderr,
		"durationMs": durationMs,
	}
	b, _ := json.Marshal(body)
	url := fmt.Sprintf("%s/api/schedules/%s/logs", apiURL, scheduleID)
	req, err := http.NewRequest("POST", url, bytes.NewReader(b))
	if err != nil {
		slog.Error("failed to create cron report request", "err", err)
		return
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-API-Key", os.Getenv("WORKER_API_KEY"))
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		slog.Error("failed to report cron result", "err", err)
		return
	}
	defer resp.Body.Close()
	if resp.StatusCode >= 300 {
		slog.Error("cron report rejected", "status", resp.StatusCode)
	}
}
