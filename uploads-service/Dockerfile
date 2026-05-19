FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package.json
RUN npm install --omit=dev

COPY src ./src

RUN mkdir -p /data/uploads

EXPOSE 3010

CMD ["npm", "start"]

