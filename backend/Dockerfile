FROM node:20-alpine AS base
WORKDIR /app

# Install OS deps if needed (e.g., openssl for Prisma)
RUN apk add --no-cache openssl

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

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=deps /app/prisma ./prisma
COPY package*.json ./

EXPOSE 3001
CMD ["node", "dist/server.js"]
