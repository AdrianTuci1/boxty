package proxy

import (
	"context"
	"crypto/tls"
	"io"
	"log/slog"
	"net"
	"strings"
	"sync"

	"github.com/boxty/gateway/internal/route"
)

// Proxy handles TLS termination and TCP forwarding to workers.
type Proxy struct {
	resolver *route.Resolver
	cert     tls.Certificate
	mu       sync.Mutex
	closed   bool
	listener net.Listener
	wg       sync.WaitGroup
}

// New creates a new proxy.
func New(resolver *route.Resolver, cert tls.Certificate) *Proxy {
	return &Proxy{
		resolver: resolver,
		cert:     cert,
	}
}

// ListenAndServe starts the proxy on the given address.
func (p *Proxy) ListenAndServe(addr string) error {
	config := &tls.Config{
		Certificates: []tls.Certificate{p.cert},
		MinVersion:   tls.VersionTLS12,
	}

	ln, err := tls.Listen("tcp", addr, config)
	if err != nil {
		return err
	}
	p.listener = ln
	slog.Info("proxy listening", "addr", addr)

	for {
		conn, err := ln.Accept()
		if err != nil {
			p.mu.Lock()
			closed := p.closed
			p.mu.Unlock()
			if closed {
				return nil
			}
			slog.Error("accept error", "err", err)
			continue
		}
		p.wg.Add(1)
		go p.handle(conn)
	}
}

func (p *Proxy) handle(client net.Conn) {
	defer p.wg.Done()
	defer client.Close()

	// Peek at the first bytes to extract the Host header (SNI already handled by TLS)
	buf := make([]byte, 4096)
	n, err := client.Read(buf)
	if err != nil {
		slog.Error("read from client failed", "err", err)
		return
	}
	data := buf[:n]

	host := extractHost(string(data))
	if host == "" {
		slog.Error("no host header")
		return
	}

	sandboxID, port := parseSubdomain(host)

	// Resolve sandbox → worker
	entry, err := p.resolver.Resolve(sandboxID)
	if err != nil {
		slog.Error("resolve failed", "sandbox", sandboxID, "err", err)
		// Try to send a simple error response
		_, _ = client.Write([]byte("HTTP/1.1 404 Not Found\r\nContent-Length: 0\r\n\r\n"))
		return
	}

	// Connect to worker's TCP proxy (port 9003)
	workerAddr := net.JoinHostPort(entry.WorkerHost, "9003")
	backend, err := net.Dial("tcp", workerAddr)
	if err != nil {
		slog.Error("dial worker failed", "addr", workerAddr, "err", err)
		_, _ = client.Write([]byte("HTTP/1.1 502 Bad Gateway\r\nContent-Length: 0\r\n\r\n"))
		return
	}
	defer backend.Close()

	slog.Debug("proxying", "sandbox", sandboxID, "port", port, "worker", workerAddr)

	// Forward the original data (Host header intact, so worker TCP proxy can route)
	if _, err := backend.Write(data); err != nil {
		return
	}

	// Bidirectional copy
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

// Shutdown gracefully stops the proxy.
func (p *Proxy) Shutdown(ctx context.Context) error {
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

func extractHost(data string) string {
	lines := strings.Split(data, "\r\n")
	for _, line := range lines {
		if strings.HasPrefix(strings.ToLower(line), "host: ") {
			return strings.TrimSpace(line[6:])
		}
	}
	return ""
}

// parseSubdomain extracts sandboxID and port from "sandboxId-port.boxty.dev"
// Examples: "abc123-8080.boxty.dev" → ("abc123", "8080")
//           "abc123.boxty.dev"     → ("abc123", "8080")  (default port)
func parseSubdomain(host string) (sandboxID, port string) {
	// Strip domain suffix
	host = strings.TrimSuffix(host, ".boxty.dev")
	host = strings.TrimSpace(host)

	// Split by last dash for port
	lastDash := strings.LastIndex(host, "-")
	if lastDash > 0 {
		sandboxID = host[:lastDash]
		port = host[lastDash+1:]
	} else {
		sandboxID = host
		port = "8080" // default HTTP port
	}

	// Handle edge case: sandbox IDs contain dashes (UUID). The last dash separates port.
	// e.g. "550e8400-e29b-41d4-a716-446655440000-3000" → ID="550e8400-e29b-41d4-a716-446655440000", port="3000"
	// The above already handles this correctly since we use LastIndex.

	return sandboxID, port
}
