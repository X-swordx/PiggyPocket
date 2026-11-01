#!/bin/bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

export ENV_FILE="${ENV_FILE:-$SCRIPT_DIR/.env.stage}"
export PROJECT_NAME="${PROJECT_NAME:-piggy-pocket-stage}"
export COMPOSE_FILE="${COMPOSE_FILE:-$SCRIPT_DIR/../cloud/docker-compose.yml}"

exec bash "$SCRIPT_DIR/../cloud/healthcheck.sh"
