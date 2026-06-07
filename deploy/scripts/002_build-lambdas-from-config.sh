#!/usr/bin/env bash
# Build all Lambdas from a JSON array config.
# Each item: {"name":"appsync-api","zip":"appsync-api.zip","schema":"optional/path.graphql"}
# Usage: 002_build-lambdas-from-config.sh '<json>'  OR  002_build-lambdas-from-config.sh @config.json
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CONFIG="${1:?JSON config required}"

cd "$ROOT_DIR"

if [[ "${CONFIG}" == @* ]]; then
  CONFIG_FILE="${CONFIG#@}"
  if [[ ! -f "${CONFIG_FILE}" ]]; then
    echo "Config file not found: ${CONFIG_FILE}" >&2
    exit 1
  fi
  mapfile -t ITEMS < <(jq -c '.[]' "${CONFIG_FILE}")
else
  mapfile -t ITEMS < <(jq -c '.[]' <<<"${CONFIG}")
fi

if [[ "${#ITEMS[@]}" -eq 0 ]]; then
  echo "No Lambdas defined in config." >&2
  exit 1
fi

for item in "${ITEMS[@]}"; do
  NAME=$(jq -r '.name' <<<"${item}")
  ZIP=$(jq -r '.zip' <<<"${item}")
  SCHEMA=$(jq -r '.schema // empty' <<<"${item}")
  bash deploy/scripts/003_build-lambda-artifact.sh "${NAME}" "${ZIP}" "${SCHEMA}"
done
