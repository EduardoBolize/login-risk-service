# syntax=docker/dockerfile:1
# Build context: repository root (pnpm workspace).

FROM node:22-alpine AS base
RUN apk add --no-cache openssl && corepack enable
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
# The postinstall hook runs `prisma generate`, which needs the schema.
COPY apps/api/prisma apps/api/prisma

FROM base AS build
RUN pnpm install --frozen-lockfile --filter api
COPY apps/api apps/api
RUN pnpm --filter api build

FROM base AS prod-deps
RUN pnpm install --frozen-lockfile --filter api --prod

FROM node:22-alpine AS runtime
RUN apk add --no-cache openssl
ENV NODE_ENV=production
WORKDIR /app
# pnpm's node_modules is a tree of symlinks into node_modules/.pnpm; COPY preserves them.
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=prod-deps --chown=node:node /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build --chown=node:node /app/apps/api/dist ./apps/api/dist
COPY --chown=node:node apps/api/prisma ./apps/api/prisma
COPY --chown=node:node apps/api/package.json ./apps/api/

USER node
WORKDIR /app/apps/api
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/health || exit 1

# Prisma takes an advisory lock, so concurrent tasks migrating at boot is safe.
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && exec node dist/main.js"]
