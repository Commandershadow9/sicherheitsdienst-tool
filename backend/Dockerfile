FROM node:20-bookworm-slim AS base
WORKDIR /app

# Install OS deps if needed (e.g., openssl for Prisma)
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

FROM base AS deps
WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma
RUN npm ci
RUN npx prisma generate

FROM deps AS build
WORKDIR /app
COPY src ./src
RUN npm run build

FROM node:20-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install wget for healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends wget && rm -rf /var/lib/apt/lists/*

# Create non-root user with group matching svc-docstore (GID 109)
RUN groupadd -g 109 svc-docstore || true && \
    useradd -u 1001 -g 109 -s /bin/sh -m appuser

COPY --from=deps --chown=appuser:svc-docstore /app/node_modules ./node_modules
COPY --from=build --chown=appuser:svc-docstore /app/dist ./dist
COPY --from=deps --chown=appuser:svc-docstore /app/prisma ./prisma
COPY --chown=appuser:svc-docstore package*.json ./

# Create logs directory with correct permissions
RUN mkdir -p logs && chown -R appuser:svc-docstore logs

USER appuser

EXPOSE 3001
CMD ["node", "dist/server.js"]
