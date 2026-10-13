#!/usr/bin/env bash
# ============================================================
#  deploy/update.sh
#  Linux equivalent of deploy\update.bat
# ============================================================
ROOT="$(cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")/.." && pwd)"
exec "$ROOT/update.sh" "$@"
