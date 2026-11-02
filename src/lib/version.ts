import fs from "fs";
import path from "path";

export interface VersionInfo {
  name: string;
  version: string;
  gitCommit: string;
  buildTime: string;
  displayVersion: string;
  isLocal: boolean;
}

let cachedVersionInfo: VersionInfo | null = null;

/**
 * Universal version resolution for Bure Clinic ERP.
 *
 * Resolves application version, git commit, and build timestamp
 * across local development, Docker containers, and production environments.
 * Results are cached in memory for zero-overhead repeated calls.
 */
export function getVersionInfo(): VersionInfo {
  if (cachedVersionInfo) {
    return cachedVersionInfo;
  }

  let version = "0.1.29";
  let name = "Bure Clinic ERP";
  let gitCommit = "unknown";
  let buildTime = new Date().toISOString();
  let isLocal = true;

  try {
    const cwd = process.cwd();

    // 1. First priority: version.json (stamped at build / Docker packaging)
    const jsonPath = path.join(cwd, "version.json");
    if (fs.existsSync(jsonPath)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
        if (parsed.version) version = String(parsed.version).trim();
        if (parsed.name) name = String(parsed.name).trim();
        if (parsed.gitCommit) gitCommit = String(parsed.gitCommit).trim();
        if (parsed.buildTime) buildTime = String(parsed.buildTime).trim();
      } catch (_) {}
    }

    // 2. Second priority: canonical VERSION file
    if (version === "0.1.29") {
      const versionFilePath = path.join(cwd, "VERSION");
      if (fs.existsSync(versionFilePath)) {
        try {
          const v = fs.readFileSync(versionFilePath, "utf-8").trim();
          if (v) version = v;
        } catch (_) {}
      }
    }

    // 3. Third priority: package.json
    if (version === "0.1.29") {
      const pkgPath = path.join(cwd, "package.json");
      if (fs.existsSync(pkgPath)) {
        try {
          const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
          if (pkg.version) version = String(pkg.version).trim();
          if (pkg.description) name = String(pkg.description).trim();
        } catch (_) {}
      }
    }

    // 4. Resolve gitCommit if still unknown
    if (gitCommit === "unknown") {
      const txtPath = path.join(cwd, "version.txt");
      if (fs.existsSync(txtPath)) {
        try {
          const h = fs.readFileSync(txtPath, "utf-8").trim();
          if (h && h.length >= 6) gitCommit = h;
        } catch (_) {}
      }
    }

    if (gitCommit === "unknown" && process.env.GIT_COMMIT) {
      gitCommit = process.env.GIT_COMMIT.slice(0, 7);
    }

    // 5. In local dev outside Docker, try direct git rev-parse as fallback
    if (gitCommit === "unknown") {
      try {
        const { execSync } = require("child_process");
        const h = execSync("git rev-parse --short HEAD", {
          stdio: ["ignore", "pipe", "ignore"],
          timeout: 1000,
        })
          .toString()
          .trim();
        if (h) gitCommit = h;
      } catch (_) {}
    }

    isLocal = gitCommit === "unknown" || gitCommit === "local";
  } catch (_) {}

  const displayVersion = `v${version}${gitCommit !== "unknown" ? ` (${gitCommit})` : " (Local)"}`;

  cachedVersionInfo = {
    name,
    version,
    gitCommit,
    buildTime,
    displayVersion,
    isLocal,
  };

  return cachedVersionInfo;
}

/**
 * Resets the in-memory cache (used during hot reload or version bumping)
 */
export function resetVersionCache(): void {
  cachedVersionInfo = null;
}
