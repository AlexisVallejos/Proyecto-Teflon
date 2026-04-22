FROM node:20-alpine AS web-build

ARG VITE_API_URL=
ARG VITE_EDITOR_HOST=editor.vase.ar

WORKDIR /app/web
COPY web/package*.json ./
RUN npm ci
COPY web/ ./
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_EDITOR_HOST=$VITE_EDITOR_HOST
RUN npm run build

FROM node:20-alpine AS runtime

ENV NODE_ENV=production
ENV PORT=3000

WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --omit=dev
COPY server/ ./
COPY --from=web-build /app/web/dist /app/web/dist

EXPOSE 3000

CMD ["node", "src/index.js"]
