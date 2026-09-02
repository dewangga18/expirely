#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_PORT="${EXPIRELY_BACKEND_PORT:-8080}"
FRONTEND_PORT="${EXPIRELY_FRONTEND_PORT:-8081}"
GO_BUILD_CACHE="${EXPIRELY_GO_CACHE:-${TMPDIR:-/tmp}/expirely-go-build-cache}"

usage() {
  cat <<'EOF'
Usage: bash scripts/expirely.sh <command>

Commands:
  rebuild  Build the frontend, then build the backend.
  stop     Stop this project's frontend and backend development listeners.
EOF
}

process_cwd() {
  local pid="$1"

  lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p' | head -n 1
}

stop_listener() {
  local port="$1"
  local name="$2"
  local expected_cwd="$3"
  local pids pid cwd stopped=false

  pids="$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"

  if [[ -z "$pids" ]]; then
    echo "$name is not running on port $port."
    return
  fi

  while IFS= read -r pid; do
    [[ -z "$pid" ]] && continue
    cwd="$(process_cwd "$pid")"

    if [[ "$cwd" != "$expected_cwd" ]]; then
      echo "Refusing to stop PID $pid on port $port: cwd is ${cwd:-unknown}, not $expected_cwd."
      continue
    fi

    echo "Stopping $name (PID $pid, port $port)."
    kill -TERM "$pid"
    stopped=true
  done <<< "$pids"

  if [[ "$stopped" == false ]]; then
    echo "$name was left running because it is not owned by this project."
  fi
}

rebuild() {
  echo "Building frontend..."
  (
    cd "$PROJECT_ROOT/expirely-frontend"
    yarn build
  )

  echo "Building backend..."
  mkdir -p "$GO_BUILD_CACHE"
  (
    cd "$PROJECT_ROOT/expirely-backend"
    GOCACHE="$GO_BUILD_CACHE" make build
  )

  echo "Frontend and backend rebuild completed."
}

case "${1:-}" in
  rebuild)
    rebuild
    ;;
  stop)
    stop_listener "$FRONTEND_PORT" "Frontend" "$PROJECT_ROOT/expirely-frontend"
    stop_listener "$BACKEND_PORT" "Backend" "$PROJECT_ROOT/expirely-backend"
    ;;
  -h | --help | help)
    usage
    ;;
  *)
    usage >&2
    exit 1
    ;;
esac
