# syntax=docker/dockerfile:1
FROM golang:1.22-alpine AS builder
WORKDIR /src
COPY go.mod go.sum* ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /gateway ./cmd/gateway

FROM alpine:3.19
RUN apk add --no-cache ca-certificates
COPY --from=builder /gateway /usr/local/bin/gateway
ENV API_URL=http://localhost:3000
ENV GATEWAY_API_KEY=boxty-gateway-secret
ENV LISTEN_ADDR=:8443
EXPOSE 8000 8443
ENTRYPOINT ["/usr/local/bin/gateway"]
