FROM node:18.14.0-buster
WORKDIR /app
COPY . .
RUN npm i
EXPOSE 3028
CMD ["node", "server.js"]
