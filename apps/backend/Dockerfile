# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root workspace files
COPY package.json package-lock.json* turbo.json ./
COPY apps/backend/package.json apps/backend/
COPY packages/shared-types/package.json packages/shared-types/

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source
COPY apps/backend/ apps/backend/
COPY packages/shared-types/ packages/shared-types/

# Generate Prisma client
RUN cd apps/backend && npx prisma generate

# Build
RUN cd apps/backend && npm run build

# Stage 2: Production
FROM node:20-alpine AS runner

WORKDIR /app

# Copy built output and deps
COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/node_modules ./node_modules
COPY --from=builder /app/node_modules ./root_node_modules
COPY --from=builder /app/apps/backend/prisma ./prisma
COPY --from=builder /app/apps/backend/package.json ./

# Set node_modules path
ENV NODE_PATH=/app/root_node_modules:/app/node_modules

EXPOSE 3000

CMD ["node", "dist/main.js"]
