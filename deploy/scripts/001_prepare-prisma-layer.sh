#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

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

  # Cleanup
  echo "Cleaning up workspace ..."
  rm -rf layers/prisma

  # Create layer
  echo "Creating layer ..."
  mkdir -p layers/prisma/nodejs/node_modules/.prisma
  mkdir -p layers/prisma/nodejs/node_modules/@prisma

  # Copy Prisma Client
  echo "Prepare Prisma Client lambda layer ..."
  cp -r node_modules/.prisma/client layers/prisma/nodejs/node_modules/.prisma
  cp -r node_modules/@prisma layers/prisma/nodejs/node_modules

  # Remove Prisma CLI
  echo "Remove Prisma CLI..."
  rm -rf layers/prisma/nodejs/node_modules/@prisma/cli

  # Remove Prisma native binaries
  echo "Remove Prisma native binaries..."
  rm -rf layers/prisma/nodejs/node_modules/.prisma/client/*darwin* || true
  rm -rf layers/prisma/nodejs/node_modules/.prisma/client/*windows* || true
  rm -rf layers/prisma/nodejs/node_modules/.prisma/client/*debian* || true
  rm -rf layers/prisma/nodejs/node_modules/@prisma/engines || true

  # Compress
  echo "Compressing ..."
  pushd layers/prisma >/dev/null
  tar -zcf /tmp/nodejs.tar.gz .
  mv /tmp/nodejs.tar.gz ./nodejs.tar.gz

  # Cleanup
  echo "Remove unzipped files ..."
  rm -rf nodejs

  # Output
  echo "Stats:"
  ls -lh nodejs.tar.gz

  popd >/dev/null
}

prepare_prisma_lambda_layer
