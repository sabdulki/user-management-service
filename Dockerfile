
# How to run
# docker build -t ums .
# docker run -p 5000:5000 ums
# to stop: docker stop ums

# Базовый образ
FROM node:22

# Устанавливаем рабочую директорию
WORKDIR /app

# Set environment variables directly (not secure for production)
ENV JWT_SECRET=super_secure_secret_key
ENV JWT_SALT=random_salt_string
ENV JWT_ACCESS_EXPIRES_IN=15m
ENV JWT_REFRESH_EXPIRES_IN=90d
ENV RADISH_HOST=localhost
ENV RADISH_PORT=5100
ENV PORT=5000
ENV GOOGLE_CLIENT_ID=google_client_id
ENV GOOGLE_CLIENT_SECRET=google_client_secret
ENV GOOGLE_CALLBACK_URL=http://localhost:5000/auth/api/rest/google/login/callback
ENV ESS_HOST=localhost
ENV ESS_PORT=5200
ENV WEBSITE_URL=http://localhost:3000
# add alć new env

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем остальные файлы
COPY . .

COPY ./db/migrations /app/db/migrations
COPY ./public/avatars /app/public/avatars

# Компилируем TypeScript, если у тебя есть tsconfig.json
# Убери если не используешь сборку и запускаешь через ts-node
RUN npm run build

# Пробрасываем порт
EXPOSE 5000

# Команда для запуска (если используешь ts-node)
CMD ["sh", "./docker-run.sh"]

