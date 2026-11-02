#!/usr/bin/env bash
# ============================================================
#  install-watcher.sh (Convenience wrapper at repo root)
#  Forwards directly to deploy/install-watcher.sh
# ============================================================
ROOT="$(cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")" && pwd)"
exec /bin/bash "$ROOT/deploy/install-watcher.sh" "$@"
