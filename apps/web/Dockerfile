FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY apps/web/package*.json apps/web/
RUN npm install --workspace=apps/web
COPY apps/web apps/web
RUN npm run build --workspace=apps/web

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/apps/web/.next ./.next
COPY --from=build /app/apps/web/node_modules ./node_modules
COPY --from=build /app/apps/web/public ./public
COPY apps/web/package*.json ./
EXPOSE 3000
CMD ["npm", "run", "start"]
