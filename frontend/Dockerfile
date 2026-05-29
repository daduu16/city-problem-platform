FROM node:20-alpine AS builder
WORKDIR /app
ARG VITE_API_URL=http://localhost:3001
ARG VITE_WS_URL=http://localhost:3001
ARG VITE_MAPBOX_TOKEN=
ENV VITE_API_URL=$VITE_API_URL VITE_WS_URL=$VITE_WS_URL VITE_MAPBOX_TOKEN=$VITE_MAPBOX_TOKEN
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
