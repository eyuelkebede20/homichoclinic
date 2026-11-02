#!/usr/bin/env bash
# ============================================================
#  clinic-watcher.sh (Convenience wrapper at repo root)
#  Forwards directly to deploy/clinic-watcher.sh
# ============================================================
ROOT="$(cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")" && pwd)"
exec /bin/bash "$ROOT/deploy/clinic-watcher.sh" "$@"
