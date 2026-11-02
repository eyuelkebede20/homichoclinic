# Bure Clinic ERP — System Versioning Architecture

## 1. Overview
Bure Clinic ERP utilizes a multi-tiered Semantic Versioning (SemVer `MAJOR.MINOR.PATCH`) system designed for high reliability across local development, multi-platform on-premise deployments (Windows & Ubuntu Linux), and containerized Docker environments.

---

## 2. Canonical Source of Truth

The versioning state is maintained through four synchronized layers:

| Layer | File / Location | Purpose |
|---|---|---|
| **Primary Canonical** | `VERSION` | Single-line SemVer string (`0.1.29`). The authoritative source for build and release automation. |
| **Package Manifest** | `package.json` | Project identity (`"name": "bure-clinic"`) and application version (`"version": "0.1.29"`). |
| **Build Stamp** | `version.json` | Complete metadata bundle (`name`, `version`, `gitCommit`, `buildTime`) baked directly into Docker production images. |
| **Git Reference** | `version.txt` | Short git commit hash (e.g. `c00473b`), updated on startup and git pull. |

---

## 3. Universal Version Module (`src/lib/version.ts`)

Server components, API handlers, and background workers access version information through `getVersionInfo()`.

```typescript
import { getVersionInfo } from "@/lib/version";

const { version, gitCommit, displayVersion, buildTime } = getVersionInfo();
// Result: { version: "0.1.29", gitCommit: "c00473b", displayVersion: "v0.1.29 (c00473b)", ... }
```

### Resolution Order:
1. **`version.json`**: Embedded during Docker build / container startup.
2. **`VERSION`**: Canonical file at repository root.
3. **`package.json`**: Node package manifest.
4. **`version.txt` / Environment**: Host-injected git hash or `process.env.GIT_COMMIT`.
5. **Direct Git Fallback**: `git rev-parse --short HEAD` (active in local development).
6. **In-Memory Cache**: Zero-overhead resolution across subsequent server requests.

---

## 4. Public API Endpoints

### `GET /api/version`
Returns detailed system version, commit, uptime, and server time.

**Response:**
```json
{
  "name": "Bure Clinic ERP",
  "version": "0.1.29",
  "gitCommit": "c00473b",
  "buildTime": "2026-10-27T12:00:00.000Z",
  "displayVersion": "v0.1.29 (c00473b)",
  "environment": "production",
  "uptime": 1420,
  "serverTime": "2026-10-27T16:24:14.228Z",
  "status": "ok"
}
```

**HTTP Headers:**
- `X-App-Version`: `0.1.29`
- `X-Git-Commit`: `c00473b`
- `X-Server-Time`: `2026-10-27T16:24:14.228Z`

### `GET /api/health`
Used by Docker health checks and host watchers.
Returns `{ ok: true, version: "0.1.29", commit: "c00473b" }` with `X-App-Version` header.

---

## 5. Docker Standalone Packaging

In production Alpine Linux containers, `.git` is intentionally omitted to minimize image size. To prevent `unknown` versions:
1. `Dockerfile` copies `VERSION`, `version.json`, `version.txt`, and `package.json` into the runtime container:
   ```dockerfile
   COPY --from=build --chown=node:node /app/VERSION ./VERSION
   COPY --from=build --chown=node:node /app/version.json* ./
   COPY --from=build --chown=node:node /app/version.txt* ./
   COPY --from=build --chown=node:node /app/package.json ./package.json
   ```
2. `START.bat` and `start.sh` automatically regenerate `version.json` with the current git commit before running `docker compose up -d --build`.

---

## 6. How to Bump Versions

### On Windows:
Double-click `BUMP_VERSION.bat` or run:
```cmd
BUMP_VERSION.bat
```

### On Linux / Ubuntu Server:
Run:
```bash
./bump_version.sh
```

### Options provided:
- **1) Patch** (`0.1.x`): Clinical bug fixes, layout adjustments.
- **2) Minor** (`0.x.0`): New features (e.g. weekly morbidity reports, lab modules).
- **3) Major** (`x.0.0`): Major database schema overhaul or architecture changes.
- **4) Custom**: Explicit version entry.

The script automatically synchronizes `VERSION`, `package.json`, `version.json`, and `version.txt`, then prompts to create an annotated Git tag (`vX.Y.Z`) and push to GitHub.
