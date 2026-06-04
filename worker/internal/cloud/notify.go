package cloud

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
)

// NotifySandboxStopped tells the API server that a sandbox was stopped (idle timeout or manual).
func (r *Registrar) NotifySandboxStopped(ctx context.Context, sandboxID string) error {
	url := fmt.Sprintf("%s/internal/sandbox/%s/stopped", r.apiURL, sandboxID)
	body := map[string]interface{}{
		"sandbox_id": sandboxID,
		"worker_id":  r.workerID,
	}
	b, _ := json.Marshal(body)
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
		slog.Warn("notify sandbox stopped failed", "status", resp.StatusCode, "sandbox", sandboxID)
		return fmt.Errorf("notify failed: %d", resp.StatusCode)
	}
	slog.Info("notified API of sandbox stop", "sandbox", sandboxID)
	return nil
}
