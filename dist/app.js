"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const rest_1 = require("./api/rest/rest");
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const app = (0, fastify_1.default)();
async function main() {
    // 1. Подключаемся к SQLite
    const db = (0, better_sqlite3_1.default)('./database.db');
    // 2. Создаем таблицу, если не существует
    db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      email TEXT UNIQUE,
      password TEXT
    )
  `);
    // 3. Передаем базу в Fastify (так ты сможешь её использовать в роутерах)
    app.decorate('sqlite', db);
    await (0, rest_1.registerRestRoutes)(app);
    app.listen({ port: 3000 }, (err, address) => {
        if (err) {
            app.log.error(err);
            process.exit(1);
        }
        console.log("Server listening at " + address);
    });
}
main();
