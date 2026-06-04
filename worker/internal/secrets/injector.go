package secrets

import (
	"fmt"
	"os"
	"path/filepath"
)

// Secret represents an injected secret.
type Secret struct {
	Name  string `json:"name"`
	Value string `json:"value"`
}

// Inject appends secrets to env slice.
func Inject(base []string, secrets []Secret) []string {
	for _, s := range secrets {
		base = append(base, fmt.Sprintf("%s=%s", s.Name, s.Value))
	}
	return base
}

// WriteEnvFile writes secrets to a .env file inside workDir.
func WriteEnvFile(workDir string, secrets []Secret) error {
	path := filepath.Join(workDir, ".env")
	f, err := os.OpenFile(path, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0600)
	if err != nil {
		return err
	}
	defer f.Close()
	for _, s := range secrets {
		if _, err := fmt.Fprintf(f, "%s=%s\n", s.Name, s.Value); err != nil {
			return err
		}
	}
	return nil
}

// Cleanup removes the .env file from workDir.
func Cleanup(workDir string) {
	_ = os.Remove(filepath.Join(workDir, ".env"))
}
