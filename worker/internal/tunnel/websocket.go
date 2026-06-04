package tunnel

import (
	"log/slog"
	"net"
	"net/http"
	"os/exec"
	"strings"
	"sync"

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
			proxyTCPOverWS(conn, sandboxID, targetPort)
		} else {
			streamSandbox(conn, mgr, sandboxID)
		}
	}
}

func streamSandbox(conn *websocket.Conn, mgr *sandbox.Manager, id string) {
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

	var wg sync.WaitGroup
	wg.Add(2)
	go func() {
		defer wg.Done()
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
		defer wg.Done()
		buf := make([]byte, 4096)
		for {
			n, err := stderr.Read(buf)
			if err != nil {
				return
			}
			_ = conn.WriteMessage(websocket.TextMessage, buf[:n])
		}
	}()

	for {
		_, _, err := conn.ReadMessage()
		if err != nil {
			break
		}
	}
	wg.Wait()
}

func proxyTCPOverWS(conn *websocket.Conn, sandboxID, port string) {
	// Dial the actual TCP port on localhost (sandbox runs in host net for rootless)
	targetAddr := strings.TrimPrefix(port, ":")
	if !strings.Contains(targetAddr, ":") {
		targetAddr = "127.0.0.1:" + targetAddr
	}
	backend, err := net.Dial("tcp", targetAddr)
	if err != nil {
		slog.Error("tcp dial failed", "addr", targetAddr, "err", err)
		return
	}
	defer backend.Close()

	var wg sync.WaitGroup
	wg.Add(2)
	go func() {
		defer wg.Done()
		for {
			mt, msg, err := conn.ReadMessage()
			if err != nil {
				return
			}
			if mt == websocket.BinaryMessage || mt == websocket.TextMessage {
				if _, err := backend.Write(msg); err != nil {
					return
				}
			}
		}
	}()
	go func() {
		defer wg.Done()
		buf := make([]byte, 4096)
		for {
			n, err := backend.Read(buf)
			if err != nil {
				return
			}
			_ = conn.WriteMessage(websocket.BinaryMessage, buf[:n])
		}
	}()
	wg.Wait()
}
