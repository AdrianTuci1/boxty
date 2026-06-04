package tunnel

import (
	"context"
	"fmt"
	"io"
	"log/slog"
	"net"
	"strings"
	"sync"

	"github.com/boxty/worker/internal/sandbox"
)

// TCPProxy is a subdomain-based TCP reverse proxy on port 9003.
type TCPProxy struct {
	mgr      *sandbox.Manager
	listener net.Listener
	wg       sync.WaitGroup
	mu       sync.Mutex
	closed   bool
}

// NewTCPProxy creates a new TCP proxy.
func NewTCPProxy(mgr *sandbox.Manager) *TCPProxy {
	return &TCPProxy{mgr: mgr}
}

// ListenAndServe starts the TCP proxy.
func (p *TCPProxy) ListenAndServe(addr string) error {
	ln, err := net.Listen("tcp", addr)
	if err != nil {
		return err
	}
	p.listener = ln
	for {
		conn, err := ln.Accept()
		if err != nil {
			p.mu.Lock()
			closed := p.closed
			p.mu.Unlock()
			if closed {
				return nil
			}
			slog.Error("tcp accept error", "err", err)
			continue
		}
		p.wg.Add(1)
		go p.handle(conn)
	}
}

func (p *TCPProxy) handle(client net.Conn) {
	defer p.wg.Done()
	defer client.Close()

	// Peek at the first bytes to extract SNI or Host header for HTTP
	// For simplicity, assume HTTP and read Host header.
	buf := make([]byte, 4096)
	n, err := client.Read(buf)
	if err != nil {
		return
	}
	data := string(buf[:n])
	host := extractHost(data)
	if host == "" {
		return
	}
	parts := strings.Split(host, ".")
	if len(parts) < 1 {
		return
	}
	sandboxID := parts[0]

	// Determine target port from Host header or default 8080
	targetPort := "8080"
	// In a real implementation, resolve sandbox internal IP.
	targetAddr := fmt.Sprintf("%s:%s", sandboxID, targetPort)

	backend, err := net.Dial("tcp", targetAddr)
	if err != nil {
		slog.Error("backend dial failed", "addr", targetAddr, "err", err)
		return
	}
	defer backend.Close()

	// Send already-read data
	if _, err := backend.Write(buf[:n]); err != nil {
		return
	}

	var wg sync.WaitGroup
	wg.Add(2)
	go func() {
		defer wg.Done()
		_, _ = io.Copy(backend, client)
	}()
	go func() {
		defer wg.Done()
		_, _ = io.Copy(client, backend)
	}()
	wg.Wait()
}

func extractHost(data string) string {
	lines := strings.Split(data, "\r\n")
	for _, line := range lines {
		if strings.HasPrefix(line, "Host: ") {
			return strings.TrimSpace(strings.TrimPrefix(line, "Host: "))
		}
	}
	return ""
}

// Shutdown closes the TCP proxy.
func (p *TCPProxy) Shutdown(ctx context.Context) error {
	p.mu.Lock()
	p.closed = true
	p.mu.Unlock()
	if p.listener != nil {
		_ = p.listener.Close()
	}
	done := make(chan struct{})
	go func() {
		p.wg.Wait()
		close(done)
	}()
	select {
	case <-done:
		return nil
	case <-ctx.Done():
		return ctx.Err()
	}
}
