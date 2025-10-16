# syntax=docker/dockerfile:1.7

# --- Base args ---
ARG NODE_VERSION=20-alpine

# --- Deps: install node_modules ---
FROM node:${NODE_VERSION} AS deps
WORKDIR /app

# OS deps for Prisma engines
RUN apk add --no-cache libc6-compat

# Use npm because package-lock.json exists
COPY package*.json ./
RUN npm ci

# --- Builder: build Next.js ---
FROM deps AS builder
WORKDIR /app
COPY . .

# Generate Prisma client and build
RUN npx prisma generate
RUN npm run build

# --- Runner: minimal prod image ---
FROM node:${NODE_VERSION} AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy standalone server and static assets
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Prisma engines and schema
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

# Next.js default port
EXPOSE 3000

# Start Next.js from standalone server
CMD ["node", "server.js"]
