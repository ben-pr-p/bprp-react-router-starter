# Multi-stage Dockerfile for React Router app with optimized caching

# ========================================
# BASE STAGE - Common base image
# ========================================
FROM oven/bun:1.2 AS base
WORKDIR /app

# ========================================
# DEPENDENCIES STAGE - Install all deps
# ========================================
FROM base AS deps
# Copy only package files for better caching
COPY package.json bun.lock ./
# Install all dependencies (including dev for build)
RUN bun install --frozen-lockfile

# ========================================
# BUILD STAGE - Build the application
# ========================================
FROM base AS builder
# Copy dependencies from previous stage
COPY --from=deps /app/node_modules ./node_modules
# Copy all source files (node_modules excluded by .dockerignore)
COPY . .

# Set NODE_ENV to production for optimized build
ENV NODE_ENV=production

# Build the application
# This will run Vite build which includes Tailwind CSS processing
RUN bun run build

# ========================================
# PRODUCTION DEPS STAGE - Minimal deps
# ========================================
FROM base AS prod-deps
COPY package.json bun.lock ./
# Install only production dependencies
RUN bun install --production --frozen-lockfile

# ========================================
# RUNNER STAGE - Final production image
# ========================================
FROM base AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Copy production dependencies
COPY --from=prod-deps /app/node_modules ./node_modules

# Copy built application
COPY --from=builder /app/build ./build

# Copy necessary files for runtime
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public

# Copy database migrations folder
COPY --from=builder /app/app/database/migrations ./app/database/migrations

# Expose port
EXPOSE 3000

# Start the application
CMD ["bun", "run", "start"]