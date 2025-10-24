# Dockerfile
# Stage 1: Build the Next.js app
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app
COPY . .

# Set build-time arguments
ARG TURSO_DATABASE_URL
ARG TURSO_AUTH_TOKEN
ARG NEXTAUTH_URL
ARG NEXTAUTH_SECRET
ARG EMAIL_SERVER
ARG EMAIL_FROM

# Set environment variables
ENV TURSO_DATABASE_URL=$TURSO_DATABASE_URL
ENV TURSO_AUTH_TOKEN=$TURSO_AUTH_TOKEN
ENV NEXTAUTH_URL=$NEXTAUTH_URL
ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET
ENV EMAIL_SERVER=$EMAIL_SERVER
ENV EMAIL_FROM=$EMAIL_FROM

# Build the app
RUN npm run build

# Stage 2: Production image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy the build output from the builder stage
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json .

# Install production dependencies
RUN npm install --production

# Expose the port the app runs on
EXPOSE 3000

# Start the app
CMD ["npm", "start"]
