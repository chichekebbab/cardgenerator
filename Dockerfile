# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Build app
COPY . .

# Vite build-time environment
ARG VITE_GEMINI_API_KEY
ENV VITE_GEMINI_API_KEY=$VITE_GEMINI_API_KEY

# Debug: Log that we're building (NOT the actual key for security)
RUN echo "=== Build starting ===" && \
    echo "VITE_GEMINI_API_KEY is set: $(test -n \"$VITE_GEMINI_API_KEY\" && echo 'YES' || echo 'NO')" && \
    echo "VITE_GEMINI_API_KEY length: $(echo -n \"$VITE_GEMINI_API_KEY\" | wc -c)"

RUN npm run build

# Runtime stage
FROM node:20-alpine
WORKDIR /app

# Install a lightweight static file server
RUN npm install -g serve

# Copy built assets
COPY --from=builder /app/dist ./dist

# Cloud Run provides PORT env var
ENV PORT=8080
EXPOSE 8080

CMD ["sh", "-c", "serve -s dist -l $PORT"]
