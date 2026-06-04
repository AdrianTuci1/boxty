package main

import (
	"context"
	"crypto/rand"
	"crypto/rsa"
	"crypto/tls"
	"crypto/x509"
	"crypto/x509/pkix"
	"encoding/json"
	"encoding/pem"
	"log/slog"
	"math/big"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/boxty/gateway/internal/proxy"
	"github.com/boxty/gateway/internal/route"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	slog.SetDefault(logger)

	apiURL := os.Getenv("API_URL")
	if apiURL == "" {
		apiURL = "http://localhost:3000"
	}
	gatewayKey := os.Getenv("GATEWAY_API_KEY")
	if gatewayKey == "" {
		gatewayKey = "boxty-gateway-secret"
	}
	listenAddr := os.Getenv("LISTEN_ADDR")
	if listenAddr == "" {
		listenAddr = ":8443"
	}
	certFile := os.Getenv("TLS_CERT_FILE")
	if certFile == "" {
		certFile = "/certs/fullchain.pem"
	}
	keyFile := os.Getenv("TLS_KEY_FILE")
	if keyFile == "" {
		keyFile = "/certs/privkey.pem"
	}

	// Load TLS certificate
	cert, err := tls.LoadX509KeyPair(certFile, keyFile)
	if err != nil {
		slog.Warn("TLS cert not found, generating self-signed for dev", "certFile", certFile, "err", err)
		cert = generateDevCert()
	}

	// Create route resolver (talks to API server)
	resolver := route.NewResolver(apiURL)

	// Create proxy
	p := proxy.New(resolver, cert)

	// Start admin HTTP server (health + route upsert endpoint)
	adminMux := http.NewServeMux()
	adminMux.HandleFunc("/health", handleHealth(resolver))
	adminMux.HandleFunc("/internal/route/upsert", handleUpsert(resolver, gatewayKey))
	adminSrv := &http.Server{Addr: ":8000", Handler: adminMux}

	go func() {
		slog.Info("admin server listening", "port", 8000)
		if err := adminSrv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			slog.Error("admin server error", "err", err)
		}
	}()

	// Start proxy
	go func() {
		if err := p.ListenAndServe(listenAddr); err != nil {
			slog.Error("proxy error", "err", err)
		}
	}()

	// Wait for shutdown signal
	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, syscall.SIGTERM, syscall.SIGINT)
	<-sigCh

	slog.Info("shutting down gracefully")
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	_ = adminSrv.Shutdown(shutdownCtx)
	_ = p.Shutdown(shutdownCtx)

	slog.Info("shutdown complete")
}

func handleHealth(resolver *route.Resolver) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		stats := resolver.GetCacheStats()
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"status": "ok",
			"stats":  stats,
		})
	}
}

func handleUpsert(resolver *route.Resolver, expectedKey string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
			return
		}
		if r.Header.Get("X-Gateway-Key") != expectedKey {
			http.Error(w, "unauthorized", http.StatusUnauthorized)
			return
		}
		var entry route.Entry
		if err := json.NewDecoder(r.Body).Decode(&entry); err != nil {
			http.Error(w, "invalid body", http.StatusBadRequest)
			return
		}
		if entry.Status == "stopped" {
			resolver.Remove(entry.SandboxID)
		} else {
			resolver.Upsert(entry)
		}
		w.WriteHeader(http.StatusOK)
		_ = json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
	}
}

// generateDevCert creates a self-signed wildcard certificate for local dev.
func generateDevCert() tls.Certificate {
	priv, err := rsa.GenerateKey(rand.Reader, 2048)
	if err != nil {
		slog.Error("failed to generate RSA key", "err", err)
		os.Exit(1)
	}

	template := x509.Certificate{
		SerialNumber: big.NewInt(1),
		Subject: pkix.Name{
			CommonName: "*.boxty.dev",
		},
		NotBefore:             time.Now(),
		NotAfter:              time.Now().Add(365 * 24 * time.Hour),
		KeyUsage:              x509.KeyUsageDigitalSignature | x509.KeyUsageKeyEncipherment,
		ExtKeyUsage:           []x509.ExtKeyUsage{x509.ExtKeyUsageServerAuth},
		DNSNames:              []string{"*.boxty.dev", "boxty.dev"},
		BasicConstraintsValid: true,
	}

	derBytes, err := x509.CreateCertificate(rand.Reader, &template, &template, &priv.PublicKey, priv)
	if err != nil {
		slog.Error("failed to create certificate", "err", err)
		os.Exit(1)
	}

	certPEM := pem.EncodeToMemory(&pem.Block{Type: "CERTIFICATE", Bytes: derBytes})
	keyPEM := pem.EncodeToMemory(&pem.Block{Type: "RSA PRIVATE KEY", Bytes: x509.MarshalPKCS1PrivateKey(priv)})

	cert, err := tls.X509KeyPair(certPEM, keyPEM)
	if err != nil {
		slog.Error("failed to load generated cert", "err", err)
		os.Exit(1)
	}
	return cert
}
