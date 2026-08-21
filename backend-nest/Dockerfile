# syntax=docker/dockerfile:1.6
# Stage 1 - deps
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package.json package-lock.json* ./
RUN npm ci --only=production=false || npm install

# Stage 2 - builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Stage 3 - production
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache dumb-init
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY package.json package-lock.json* ./
RUN npm ci --only=production || npm install --only=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/nest-cli.json ./nest-cli.json
EXPOSE 3000
USER appuser
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1
