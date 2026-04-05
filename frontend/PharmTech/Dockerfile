# Build stage
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Run stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# Default Nginx config should work for Vite SPA
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
