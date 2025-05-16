# User Management Service
Being a part of ft_transcendence 42AD project, this is a Fastify-based microservice for managing user registration, login, and authentication. This service works in coordination with the Redish (custom Redis-based) token store. So make sure to clone ft_transcendence repo first. 

## How to Use
Follow these steps to install dependencies and start the services.

Clone this repository and navigate into the user-management-service folder:
```bash
git clone https://github.com/tmazitov/ft_transcendence.git
cd ft_transcendence
cd user-management-service
```

Install project dependencies and set up environment:
```bash
touch .env
npm install
```
Open .env file and fill it with the following variables:
```
PORT=5000
JWT_SECRET=your_secret_key
JWT_SALT=your_salt
JWT_ACCESS_EXPIRE=15m
JWT_REFRESH_EXPIRE=90d
REDISH_HOST=localhost
REDISH_PORT=5100
GOOGLE_CLIENT_ID=<client_id provided by Google>
GOOGLE_CLIENT_SECRET=<client_secret provided by Google>
GOOGLE_CALLBACK_URL=http://localhost:5000/auth/api/rest/google/login/callback
```
Navigate to the redish service folder, install its dependencies, and start it:
```bash
cd ../redish
npm install
npm run dev
```
Go back to the user-management-service and start it:
```bash
cd ../user-management-service
npm run dev
```

## Notes
Make sure ports used by Redish and this service are not occupied by other apps.

The service will not run properly if Redish is not running.
