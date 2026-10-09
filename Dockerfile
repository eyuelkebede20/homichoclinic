# syntax=docker/dockerfile:1

# ---- deps: install ALL deps (prisma generate needs devDeps) ----
FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts

# ---- build ----
FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generate prisma client then build Next.js in standalone mode
# We use a cache mount for .next/cache so rebuilds are incredibly fast
ENV BETTER_AUTH_SECRET="build-dummy-secret"
RUN --mount=type=cache,target=/app/.next/cache \
    pnpm exec prisma generate && \
    pnpm exec next build

# ---- runtime ----
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
ENV HOSTNAME="0.0.0.0"
WORKDIR /app

# Install postgresql-client for pg_dump and psql backups
RUN apk add --no-cache postgresql-client

# Copy the standalone output (includes its own node_modules subset)
COPY --from=build --chown=node:node /app/.next/standalone ./
# Copy the static assets that standalone doesn't include itself
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
# Copy prisma schema for migrations that run at startup
COPY --from=build --chown=node:node /app/prisma ./prisma
# Copy src for seed scripts that rely on local typescript modules (e.g., auth)
COPY --from=build --chown=node:node /app/src ./src
# Copy the entire node_modules from deps to ensure Prisma CLI and Client are perfectly intact (needed for pnpm symlinks)
COPY --from=build --chown=node:node /app/node_modules ./node_modules

USER node
EXPOSE 3100

# Run migrations then start the app.
# `prisma migrate deploy` is idempotent and safe to run on every startup.
# We use `npx` from the standalone's bundled node_modules.
CMD ["sh", "-c", "if [ -d prisma/migrations ]; then npx prisma migrate deploy; else npx prisma db push --accept-data-loss; fi && npx prisma db seed 2>/dev/null ; node server.js"]