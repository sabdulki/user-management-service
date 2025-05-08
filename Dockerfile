
# How to run
# docker build -t fastify-app .
# docker run -p 3000:3000 fastify-app
# to stop: docker stop fastify-app

# Базовый образ
FROM node:22

# Устанавливаем рабочую директорию
WORKDIR /app

# Set environment variables directly (not secure for production)
ENV JWT_SECRET=super_secure_secret_key
ENV JWT_SALT=random_salt_string
ENV JWT_ACCESS_EXPIRES_IN=15m
ENV JWT_REFRESH_EXPIRES_IN=90d

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем остальные файлы
COPY . .

# Компилируем TypeScript, если у тебя есть tsconfig.json
# Убери если не используешь сборку и запускаешь через ts-node
RUN npm run build

# Пробрасываем порт
EXPOSE 3000

# Команда для запуска (если используешь ts-node)
CMD ["sh", "./docker-run.sh"]

