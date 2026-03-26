# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install fonts for PDFKit and curl for healthcheck (permanent)
# Build tools are installed temporarily and removed after bcrypt compilation
RUN apk add --no-cache fontconfig ttf-dejavu curl

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Install build tools, compile native deps, remove build tools, and set permissions
# All in one layer to avoid duplicating ~200MB of node_modules in separate chown layer
RUN apk add --no-cache --virtual .build-deps python3 make g++ && \
    npm ci --only=production && \
    npm rebuild bcrypt --build-from-source && \
    npm cache clean --force && \
    apk del .build-deps && \
    mkdir -p /app/logs && \
    chown -R nestjs:nodejs /app

USER nestjs

# Force IPv4 DNS resolution to avoid IPv6 connectivity issues with some cloud providers
ENV NODE_OPTIONS="--dns-result-order=ipv4first"

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

CMD ["node", "dist/main"]
