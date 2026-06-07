#!/usr/bin/env bash
# Build one Lambda handler, zip it, and stage under artifacts/<api-name>/.
# Usage: 003_build-lambda-artifact.sh <api-name> <zip-filename> [schema-source-path]
set -euo pipefail

API_NAME="${1:?api name required}"
ZIP_FILE="${2:?zip filename required}"
SCHEMA_SOURCE="${3:-}"
ARTIFACT_DIR="artifacts/${API_NAME}"

echo "Building ${API_NAME}..."
npm run build -- "${API_NAME}"

echo "Zipping ${API_NAME}..."
zip -r -j "${ZIP_FILE}" "build/${API_NAME}"

echo "Staging ${API_NAME} artifact..."
mkdir -p "${ARTIFACT_DIR}"
cp "${ZIP_FILE}" "${ARTIFACT_DIR}/"

if [[ -n "${SCHEMA_SOURCE}" ]]; then
  cp "${SCHEMA_SOURCE}" "${ARTIFACT_DIR}/schema.graphql"
  RESOLVERS_DIR="$(dirname "${SCHEMA_SOURCE}")/resolvers"
  if [[ -d "${RESOLVERS_DIR}" ]]; then
    mkdir -p "${ARTIFACT_DIR}/resolvers"
    cp "${RESOLVERS_DIR}"/*.js "${ARTIFACT_DIR}/resolvers/"
  fi
fi

ls -lah "${ARTIFACT_DIR}"
