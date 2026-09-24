#!/usr/bin/env bash
# Runs the verbatim research artifact edge_cases.js from any location.
#
# edge_cases.js imports '../frontend/src/lib/scan/receipt-parser.ts' relative to
# its OWN directory, so it only resolves when the script is staged one level
# below a directory that contains frontend/src/lib/scan/. This runner stages it
# inside the worktree and cleans up afterwards. The artifact is never modified.
#
# Requires Node with TypeScript type stripping (Node >= 22.6 with
# --experimental-strip-types, or Node >= 23.6 where it is on by default).
set -euo pipefail

SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKTREE="$(cd "$SRC/../../../../.." && pwd)"
STAGE="$WORKTREE/.run-edge-cases"
PARSER="$WORKTREE/frontend/src/lib/scan/receipt-parser.ts"

if [ ! -f "$PARSER" ]; then
  echo "error: parser not found at $PARSER" >&2
  echo "       run this from a worktree that contains frontend/src/lib/scan/" >&2
  exit 1
fi

cleanup() { rm -rf "$STAGE"; }
trap cleanup EXIT

mkdir -p "$STAGE"
cp "$SRC/edge_cases.js" "$STAGE/edge_cases.js"
node "$STAGE/edge_cases.js"
