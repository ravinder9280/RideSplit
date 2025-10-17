# syntax=docker/dockerfile:1.7

ARG BUN_VERSION=1.2.11

# ---------- deps (bun) ----------
FROM oven/bun:${BUN_VERSION} AS deps
WORKDIR /app

# Prisma needs OpenSSL at build-time for generate
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy minimal files required for dependency install and prisma postinstall
COPY package.json ./
# COPY bun.lockb ./bun.lockb   # uncomment if you have it for better caching
COPY prisma ./prisma

# Install deps with Bun (will run postinstall -> prisma generate)
ENV NEXT_TELEMETRY_DISABLED=1
RUN bun install

# ---------- builder ----------
FROM deps AS builder
WORKDIR /app
COPY . .

# Provide dummy Clerk keys to avoid build-time prerender errors
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=dummy_pk_for_build_only
ARG CLERK_PUBLISHABLE_KEY=dummy_pk_for_build_only
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
ENV CLERK_PUBLISHABLE_KEY=${CLERK_PUBLISHABLE_KEY}
ENV NEXT_TELEMETRY_DISABLED=1

RUN bun run build

# ---------- runner ----------
FROM oven/bun:${BUN_VERSION} AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Install OpenSSL in the runtime image too (critical for Prisma)
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy standalone server and static assets
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Prisma engines and schema (the engines are in .prisma; client is bundled in standalone)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

# Expect real secrets at runtime via env-file
CMD ["bun", "server.js"]
