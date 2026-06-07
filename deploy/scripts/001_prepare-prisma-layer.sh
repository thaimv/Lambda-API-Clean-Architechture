#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LAYER_ZIP="prisma-layer.zip"

function prepare_prisma_lambda_layer() {
  cd "$ROOT_DIR"

  if [ ! -d node_modules ] || [ ! -x node_modules/.bin/prisma ]; then
    echo "Installing dependencies..."
    npm ci
  fi

  echo "Generating Prisma client..."
  npm run generate

  if [ ! -d node_modules/.prisma/client ]; then
    echo "Error: Prisma client was not generated in node_modules/.prisma/client"
    exit 1
  fi

  echo "Cleaning up workspace ..."
  rm -rf layers/prisma

  echo "Creating layer ..."
  mkdir -p layers/prisma/nodejs/node_modules/.prisma
  mkdir -p layers/prisma/nodejs/node_modules/@prisma

  echo "Prepare Prisma Client lambda layer ..."
  cp -r node_modules/.prisma/client layers/prisma/nodejs/node_modules/.prisma
  cp -r node_modules/@prisma layers/prisma/nodejs/node_modules

  echo "Remove Prisma CLI..."
  rm -rf layers/prisma/nodejs/node_modules/@prisma/cli

  echo "Remove Prisma native binaries (keep rhel-openssl for Lambda AL2023)..."
  rm -rf layers/prisma/nodejs/node_modules/.prisma/client/*darwin* || true
  rm -rf layers/prisma/nodejs/node_modules/.prisma/client/*windows* || true
  rm -rf layers/prisma/nodejs/node_modules/.prisma/client/*debian* || true
  rm -rf layers/prisma/nodejs/node_modules/@prisma/engines || true

  echo "Compressing to ${LAYER_ZIP} ..."
  pushd layers/prisma >/dev/null
  rm -f "${LAYER_ZIP}"
  zip -r "${LAYER_ZIP}" nodejs
  rm -rf nodejs
  ls -lh "${LAYER_ZIP}"
  popd >/dev/null

  echo "Layer ready: layers/prisma/${LAYER_ZIP}"
}

prepare_prisma_lambda_layer
