# Deployment and Docker

## Container Strategy

- Multi-stage build producing static files, served by `nginx:alpine`
- Runs behind Nginx Proxy Manager (NPM) for TLS and domains

## Dockerfile (planned)

Stage 1 — build:

```
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build
```

Stage 2 — serve:

```
FROM nginx:alpine
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
COPY ./site/dist/ /usr/share/nginx/html
EXPOSE 8080
``` 

Note: Default Nginx listens on 80; map container 80 → host 8080 if desired. NPM will reverse proxy to the container’s HTTP port; TLS terminates at NPM.

## Nginx Config (default.conf) — outline

```
server {
  listen 80;
  server_name _;

  root /usr/share/nginx/html;
  index index.html;

  # Security headers (some may be set at NPM)
  add_header X-Content-Type-Options "nosniff" always;
  add_header Referrer-Policy "no-referrer-when-downgrade" always;

  # Caching
  location ~* \.(js|css|png|jpg|jpeg|gif|svg|webp|avif|ico|woff2?)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }

  location / {
    try_files $uri /index.html;
  }
}
```

## NPM (Reverse Proxy) Notes

- Set the domain `dmeim.com` to point to NPM
- Create a Proxy Host for `dmeim.com` → container IP:port
- Enable HTTP/2/3 and HSTS in NPM (TLS certs managed there)

