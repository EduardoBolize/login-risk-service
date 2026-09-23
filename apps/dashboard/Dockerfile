# syntax=docker/dockerfile:1
# Build context: repository root (pnpm workspace). Used for local compose only —
# in AWS the static build is served from S3.

FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/dashboard/package.json apps/dashboard/
RUN pnpm install --frozen-lockfile --filter dashboard
COPY apps/dashboard apps/dashboard

# Vite inlines these at build time.
ARG VITE_API_URL=http://localhost:3000
ARG VITE_API_KEY=dev-api-key
ENV VITE_API_URL=$VITE_API_URL VITE_API_KEY=$VITE_API_KEY
RUN pnpm --filter dashboard build

FROM nginx:1.27-alpine
COPY --from=build /app/apps/dashboard/dist /usr/share/nginx/html
EXPOSE 80
