FROM node:18-alpine AS build-stage
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine AS production
RUN mkdir -p /var/log/nginx \
 && touch /var/log/nginx/access.log /var/log/nginx/error.log

COPY --from=build-stage /app/dist /app
RUN chown -R nginx:nginx /app /var/log/nginx

COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]