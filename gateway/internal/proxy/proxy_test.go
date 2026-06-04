package proxy

import "testing"

func TestExtractHost(t *testing.T) {
	tests := []struct {
		name string
		data string
		want string
	}{
		{"simple", "GET / HTTP/1.1\r\nHost: example.com\r\n\r\n", "example.com"},
		{"with port", "GET / HTTP/1.1\r\nHost: foo.bar:8080\r\n\r\n", "foo.bar:8080"},
		{"lowercase", "GET / HTTP/1.1\r\nhost: test.dev\r\n\r\n", "test.dev"},
		{"no host", "GET / HTTP/1.1\r\nAccept: */*\r\n\r\n", ""},
		{"empty", "", ""},
		{"sandbox host", "POST / HTTP/1.1\r\nHost: abc123-3000.boxty.dev\r\n\r\n", "abc123-3000.boxty.dev"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := extractHost(tt.data); got != tt.want {
				t.Errorf("extractHost(%q) = %q, want %q", tt.data, got, tt.want)
			}
		})
	}
}

func TestParseSubdomain(t *testing.T) {
	tests := []struct {
		name           string
		host           string
		wantSandbox    string
		wantPort       string
	}{
		{"simple dash", "abc123-8080.boxty.dev", "abc123", "8080"},
		{"no port", "abc123.boxty.dev", "abc123", "8080"},
		{"uuid with port", "550e8400-e29b-41d4-a716-446655440000-3000.boxty.dev", "550e8400-e29b-41d4-a716-446655440000", "3000"},
		{"uuid no port", "550e8400-e29b-41d4-a716-446655440000.boxty.dev", "550e8400-e29b-41d4-a716-446655440000", "8080"},
		{"long port", "my-sandbox-99999.boxty.dev", "my-sandbox", "99999"},
		{"no domain", "just-id-5000", "just-id", "5000"},
		{"only id", "simple", "simple", "8080"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gotSandbox, gotPort := parseSubdomain(tt.host)
			if gotSandbox != tt.wantSandbox || gotPort != tt.wantPort {
				t.Errorf("parseSubdomain(%q) = (%q, %q), want (%q, %q)", tt.host, gotSandbox, gotPort, tt.wantSandbox, tt.wantPort)
			}
		})
	}
}
