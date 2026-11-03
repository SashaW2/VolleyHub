FROM node:18-alpine

# Устанавливаем tzdata и часовой пояс
RUN apk add --no-cache tzdata
ENV TZ=Europe/Minsk

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 5000

CMD ["node", "server.js"]