# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY frontend/package*.json ./

RUN npm ci --prefer-offline --no-audit

COPY frontend/src ./src
COPY frontend/public ./public

RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install serve to run static files
RUN npm install -g serve

# Copy built app from builder
COPY --from=builder /app/build ./build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget -q -O - http://localhost:3000/ > /dev/null 2>&1 || exit 1

# Run the application
CMD ["serve", "-s", "build", "-l", "3000"]
