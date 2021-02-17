FROM node:14

# создание директории приложения
WORKDIR /usr/src/app

# установка зависимостей
# символ астериск ("*") используется для того чтобы по возможности 
# скопировать оба файла: package.json и package-lock.json
COPY package.json ./
COPY yarn.lock ./

RUN yarn
# Если вы создаете сборку для продакшн
# RUN npm ci --only=production

# копируем исходный код
COPY . .

RUN yarn build

ENV NODE_ENV production

EXPOSE 8080

CMD [ "node", "dist/index.js" ]

USER node