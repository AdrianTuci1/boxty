package tunnel

import (
	"log/slog"
	"net/http"
	"os/exec"
	"strings"

	"github.com/boxty/worker/internal/sandbox"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

// WebSocketHandler handles WS connections on port 9002.
func WebSocketHandler(mgr *sandbox.Manager) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		path := strings.Trim(r.URL.Path, "/")
		parts := strings.Split(path, "/")
		if len(parts) < 1 {
			http.Error(w, "invalid path", http.StatusBadRequest)
			return
		}
		sandboxID := parts[0]
		var targetPort string
		if len(parts) >= 2 {
			targetPort = parts[1]
		}

		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			slog.Error("websocket upgrade failed", "err", err)
			return
		}
		defer conn.Close()

		if targetPort != "" {
			// TCP tunnel mode: proxy raw bytes to sandbox:port
			proxyTCP(conn, sandboxID, targetPort)
		} else {
			// Stream stdout/stderr via runsc exec tail -f /dev/null placeholder
			streamSandbox(conn, mgr, sandboxID)
		}
	}
}

func streamSandbox(conn *websocket.Conn, mgr *sandbox.Manager, id string) {
	// Use runsc exec to stream logs or a simple echo loop
	cmd := exec.Command("runsc", "exec", id, "cat")
	stdout, err := cmd.StdoutPipe()
	if err != nil {
		slog.Error("exec pipe failed", "err", err)
		return
	}
	stderr, _ := cmd.StderrPipe()
	if err := cmd.Start(); err != nil {
		slog.Error("exec start failed", "err", err)
		return
	}
	defer cmd.Process.Kill()

	go func() {
		buf := make([]byte, 4096)
		for {
			n, err := stdout.Read(buf)
			if err != nil {
				return
			}
			_ = conn.WriteMessage(websocket.TextMessage, buf[:n])
		}
	}()
	go func() {
		buf := make([]byte, 4096)
		for {
			n, err := stderr.Read(buf)
			if err != nil {
				return
			}
			_ = conn.WriteMessage(websocket.TextMessage, buf[:n])
		}
	}()

	// Read from websocket and forward to stdin (not implemented for simplicity)
	for {
		_, _, err := conn.ReadMessage()
		if err != nil {
			break
		}
	}
}

func proxyTCP(conn *websocket.Conn, sandboxID, port string) {
	// In a real implementation, dial the sandbox internal IP:port.
	// Here we simulate by echoing back.
	for {
		mt, msg, err := conn.ReadMessage()
		if err != nil {
			break
		}
		_ = conn.WriteMessage(mt, msg)
	}
}
