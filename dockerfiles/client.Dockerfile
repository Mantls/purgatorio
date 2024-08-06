FROM node:20-alpine 

WORKDIR /home/node/app
COPY ./package*.json ./
RUN npm install
COPY . .
RUN npx tsc

CMD ["node", "build/client.js"]
