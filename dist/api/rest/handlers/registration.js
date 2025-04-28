"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registrationHandler = registrationHandler;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
// <{ Body: RegisterBody }>
async function registrationHandler(request, reply) {
    const { name, email, password } = request.body;
    // Простейшая валидация (можно использовать схемы JSON Schema или zod позже)
    if (!name || !email || !password) {
        return reply.code(400).send({ error: 'Missing name, email or password' });
    }
    // Хешируем пароль
    const hashedPassword = bcryptjs_1.default.hashSync(password, 10);
    // Получаем доступ к базе данных через fastify.sqlite
    const db = request.server.sqlite;
    try {
        // Сохраняем нового пользователя в таблицу
        const stmt = db.prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)');
        stmt.run(name, email, hashedPassword);
        return reply.code(201).send({ message: 'User registered successfully' });
    }
    catch (err) {
        // Например, пользователь с таким email уже есть
        return reply.code(400).send({ error: 'User already exists or invalid data', detail: err.message });
    }
}
