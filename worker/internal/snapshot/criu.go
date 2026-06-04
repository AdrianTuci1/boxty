package snapshot

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"os/exec"
	"path/filepath"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

// Checkpoint checkpoints a sandbox and uploads to S3.
func Checkpoint(ctx context.Context, id, workDir, s3Key string) error {
	checkpointDir := filepath.Join(workDir, "checkpoint")
	_ = os.MkdirAll(checkpointDir, 0755)

	cmd := exec.CommandContext(ctx, "runsc", "checkpoint", "--image-path", checkpointDir, id)
	out, err := cmd.CombinedOutput()
	if err != nil {
		slog.Error("runsc checkpoint failed", "output", string(out), "err", err)
		return fmt.Errorf("runsc checkpoint: %w", err)
	}

	tarPath := filepath.Join(workDir, "snapshot.tar.gz")
	cmd = exec.CommandContext(ctx, "tar", "czf", tarPath, "-C", checkpointDir, ".")
	if out, err := cmd.CombinedOutput(); err != nil {
		slog.Error("tar failed", "output", string(out), "err", err)
		return fmt.Errorf("tar: %w", err)
	}

	if err := uploadToS3(ctx, tarPath, s3Key); err != nil {
		return fmt.Errorf("upload s3: %w", err)
	}
	return nil
}

// Restore downloads a snapshot from S3 and restores it.
func Restore(ctx context.Context, id, s3Key, workDir string) error {
	tarPath := filepath.Join(workDir, "snapshot.tar.gz")
	if err := downloadFromS3(ctx, s3Key, tarPath); err != nil {
		return fmt.Errorf("download s3: %w", err)
	}

	checkpointDir := filepath.Join(workDir, "checkpoint")
	_ = os.MkdirAll(checkpointDir, 0755)
	cmd := exec.CommandContext(ctx, "tar", "xzf", tarPath, "-C", checkpointDir)
	if out, err := cmd.CombinedOutput(); err != nil {
		slog.Error("tar extract failed", "output", string(out), "err", err)
		return fmt.Errorf("tar extract: %w", err)
	}

	cmd = exec.CommandContext(ctx, "runsc", "restore", "--image-path", checkpointDir, id)
	out, err := cmd.CombinedOutput()
	if err != nil {
		slog.Error("runsc restore failed", "output", string(out), "err", err)
		return fmt.Errorf("runsc restore: %w", err)
	}
	return nil
}

func uploadToS3(ctx context.Context, filePath, key string) error {
	bucket := os.Getenv("S3_BUCKET")
	if bucket == "" {
		bucket = "boxty-snapshots"
	}
	cfg, err := config.LoadDefaultConfig(ctx)
	if err != nil {
		return err
	}
	client := s3.NewFromConfig(cfg)
	f, err := os.Open(filePath)
	if err != nil {
		return err
	}
	defer f.Close()

	_, err = client.PutObject(ctx, &s3.PutObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
		Body:   f,
	})
	return err
}

func downloadFromS3(ctx context.Context, key, dest string) error {
	bucket := os.Getenv("S3_BUCKET")
	if bucket == "" {
		bucket = "boxty-snapshots"
	}
	cfg, err := config.LoadDefaultConfig(ctx)
	if err != nil {
		return err
	}
	client := s3.NewFromConfig(cfg)
	resp, err := client.GetObject(ctx, &s3.GetObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	f, err := os.Create(dest)
	if err != nil {
		return err
	}
	defer f.Close()

	_, err = f.ReadFrom(resp.Body)
	return err
}
