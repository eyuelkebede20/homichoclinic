#!/usr/bin/env bash
# ============================================================
#  This file is kept for reference only.
#  The clinic server runs Windows — use deploy\update.bat instead.
#
#  deploy\update.bat is called automatically by the Windows
#  Task Scheduler (ClinicUpdater task) when the admin clicks
#  "Pull Latest Updates" in the web UI.
#
#  To update manually on the server:
#    double-click deploy\update.bat
# ============================================================
echo "This server runs Windows. Use deploy\update.bat instead." >&2
exit 1