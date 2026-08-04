#!/usr/bin/env bash
# remote-cmd.sh — wrappers for common remote operations against the droplet.
#
# Usage:  ./remote-cmd.sh <command>
# Commands: logs, logs:brief, logs:web, status, restart, stop, start, shell, shell:brief, shell:db, prune

set -euo pipefail

CMD="${1:-help}"
COMPOSE_FILE="docker-compose.prod.yml"

if [[ -f ".env" ]]; then
  # shellcheck disable=SC1091
  source .env
fi

DROPLET_IP="${DROPLET_IP:?DROPLET_IP not set in .env or environment}"
DEPLOY_USER="deploy"
APP_DIR="/opt/brief"

SSH_BASE=(ssh)
if [[ -n "${SSH_KEY_PATH:-}" ]]; then
  SSH_BASE+=(-i "$SSH_KEY_PATH")
fi
if [[ -n "${SSH_KNOWN_HOSTS_FILE:-}" ]]; then
  SSH_BASE+=(-o StrictHostKeyChecking=yes -o "UserKnownHostsFile=$SSH_KNOWN_HOSTS_FILE")
fi
SSH=("${SSH_BASE[@]}" "$DEPLOY_USER@$DROPLET_IP")

case "$CMD" in
  logs)        "${SSH[@]}" "cd $APP_DIR && docker compose -f $COMPOSE_FILE logs --tail=100 -f" ;;
  logs:brief)  "${SSH[@]}" "cd $APP_DIR && docker compose -f $COMPOSE_FILE logs --tail=100 -f brief" ;;
  logs:web)    "${SSH[@]}" "cd $APP_DIR && docker compose -f $COMPOSE_FILE logs --tail=100 -f web" ;;
  status)      "${SSH[@]}" "cd $APP_DIR && docker compose -f $COMPOSE_FILE ps" ;;
  restart)     "${SSH[@]}" "cd $APP_DIR && docker compose -f $COMPOSE_FILE restart" ;;
  stop)        "${SSH[@]}" "cd $APP_DIR && docker compose -f $COMPOSE_FILE down" ;;
  start)       "${SSH[@]}" "cd $APP_DIR && docker compose -f $COMPOSE_FILE up -d" ;;
  shell)       "${SSH[@]}" ;;
  shell:brief) "${SSH[@]}" "cd $APP_DIR && docker compose -f $COMPOSE_FILE exec brief sh" ;;
  shell:db)    "${SSH[@]}" "cd $APP_DIR && docker compose -f $COMPOSE_FILE exec postgres psql -U brief brief" ;;
  prune)
    echo "This will remove all stopped containers, unused images, and build cache on the droplet."
    read -r -p "Continue? [y/N] " confirm
    [[ "$confirm" == "y" ]] && "${SSH[@]}" "docker system prune -af"
    ;;
  help|*)
    echo "Usage: ./remote-cmd.sh <command>"
    echo ""
    echo "Commands:"
    echo "  logs        — tail all container logs"
    echo "  logs:brief  — tail Brief API logs"
    echo "  logs:web    — tail web UI logs"
    echo "  status      — docker compose ps"
    echo "  restart     — restart all containers"
    echo "  stop        — docker compose down"
    echo "  start       — docker compose up -d"
    echo "  shell       — SSH into the droplet"
    echo "  shell:brief — shell into the brief API container"
    echo "  shell:db    — psql into the postgres container"
    echo "  prune       — prune Docker on the droplet"
    ;;
esac
