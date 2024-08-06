FROM node:20-alpine 

LABEL org.opencontainers.image.source=https://github.com/Mantls/purgatorio

WORKDIR /home/node/app
COPY ./package*.json ./
RUN npm install
COPY . .
RUN npx tsc

CMD ["node", "build/client.js"]
