FROM node:22

WORKDIR /app

ENV PORT=5000
ENV JWT_SECRET=super_secure_secret_key
ENV JWT_SALT=random_salt_string
ENV JWT_ACCESS_EXPIRES_IN=15m
ENV JWT_REFRESH_EXPIRES_IN=90d
ENV RADISH_HOST=localhost
ENV RADISH_PORT=5100
ENV GOOGLE_CLIENT_ID=google_client_id
ENV GOOGLE_CLIENT_SECRET=google_client_secret
ENV ESS_HOST=localhost
ENV ESS_PORT=5200
ENV WEBSITE_URL=http://localhost:3000

COPY package*.json ./

RUN apt-get install && apt-get update && npm install && apt-get install sqlite3
RUN npm install

COPY . .

COPY ./db/migrations /app/db/migrations
COPY ./public/avatars /app/public/avatars

RUN npm run build

EXPOSE ${PORT}

RUN chmod +x ./docker-run.sh

CMD ["sh", "./docker-run.sh"]

