# Stage 1: Build
FROM node:20 AS builder

WORKDIR /app

# The full node image includes openssl and other necessary build tools by default.
# This avoids network issues with apk/apt mirrors.

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

# Generate Prisma client
RUN npx prisma generate
RUN npm run build

# Stage 2: Production
FROM node:20

WORKDIR /app

# Use standard groupadd/useradd for Debian-based node image
RUN groupadd -r nodejs && useradd -r -g nodejs nestjs

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
# Ensure the generated prisma client and engine are copied
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

USER nestjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/v1/health || exit 1

CMD ["npm", "run", "start:prod"]