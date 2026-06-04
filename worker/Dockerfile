# Build stage
FROM golang:1.22-alpine AS builder
RUN apk add --no-cache git ca-certificates
WORKDIR /build
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o worker ./cmd/worker

# Runtime stage
FROM alpine:3.19
RUN apk add --no-cache ca-certificates runsc docker-cli
WORKDIR /app
COPY --from=builder /build/worker /app/worker
EXPOSE 9001 9002 9003 9004
ENTRYPOINT ["/app/worker"]
