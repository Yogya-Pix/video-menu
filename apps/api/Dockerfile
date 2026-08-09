FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY apps/api/package*.json apps/api/
RUN npm install --workspace=apps/api
COPY apps/api apps/api
RUN npm run build --workspace=apps/api

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/apps/api/dist ./dist
COPY --from=build /app/apps/api/node_modules ./node_modules
COPY --from=build /app/apps/api/prisma ./prisma
COPY apps/api/package*.json ./
EXPOSE 4000
CMD ["node", "dist/index.js"]
