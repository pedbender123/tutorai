# Stage 1: Build Frontend
FROM node:20-alpine AS frontend-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
# Inject API URL for build time if needed, or use relative paths if proxied
ENV VITE_API_URL=/api
RUN npm run build

# Stage 2: Backend & Runner
FROM node:20-alpine
WORKDIR /app
COPY server/package*.json ./server/
RUN cd server && npm install
COPY server/ ./server/
COPY --from=frontend-build /app/client/dist ./client/dist

ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

# Run the server which also serves the static frontend
CMD ["npm", "start", "--prefix", "server"]
