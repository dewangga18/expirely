FROM golang:1.26-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/server cmd/api/main.go
RUN go install github.com/golang-migrate/migrate/v4/cmd/migrate@v4.18.1

FROM alpine:3.19

RUN apk --no-cache add bash ca-certificates postgresql-client tzdata

WORKDIR /app

COPY --from=builder /app/server .
COPY --from=builder /go/bin/migrate /usr/local/bin/migrate
COPY --from=builder /app/internal/database/migrations ./internal/database/migrations
COPY deployments/docker/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["./server"]
