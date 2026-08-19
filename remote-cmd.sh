#!/usr/bin/env bash
set -euo pipefail

CMD="${1:-help}"
DROPLET_IP="${DROPLET_IP:?DROPLET_IP is required}"
SSH_KNOWN_HOSTS_FILE="${SSH_KNOWN_HOSTS_FILE:?SSH_KNOWN_HOSTS_FILE is required}"
DEPLOY_USER="${DEPLOY_USER:-deploy}"
APP_DIR="${APP_DIR:-/opt/briefs}"

SSH_BASE=(ssh -o StrictHostKeyChecking=yes -o "UserKnownHostsFile=$SSH_KNOWN_HOSTS_FILE")
[[ -n "${SSH_KEY_PATH:-}" ]] && SSH_BASE+=(-i "$SSH_KEY_PATH")
SSH=("${SSH_BASE[@]}" "$DEPLOY_USER@$DROPLET_IP")

case "$CMD" in
  status)  "${SSH[@]}" "cd '$APP_DIR' && docker compose --env-file .env -f docker-compose.prod.yml ps" ;;
  logs)    "${SSH[@]}" "cd '$APP_DIR' && docker compose --env-file .env -f docker-compose.prod.yml logs --tail=100 -f" ;;
  restart) "${SSH[@]}" "cd '$APP_DIR' && docker compose --env-file .env -f docker-compose.prod.yml restart" ;;
  stop)    "${SSH[@]}" "cd '$APP_DIR' && docker compose --env-file .env -f docker-compose.prod.yml down" ;;
  start)   "${SSH[@]}" "cd '$APP_DIR' && docker compose --env-file .env -f docker-compose.prod.yml up -d" ;;
  shell)   "${SSH[@]}" ;;
  *)
    echo "Usage: $0 {status|logs|restart|stop|start|shell}" >&2
    exit 1
    ;;
esac
