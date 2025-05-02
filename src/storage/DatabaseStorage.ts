import Database, { Database as DatabaseType } from "better-sqlite3";
import IStorage from '../interfaces/storage'
import UserCreateForm from '../models/UserCreateForm'

export default class DatabaseStorage implements IStorage {
    private _db: DatabaseType

    constructor() {
        //Работает как обычное подключение к SQLite-файлу если файл уже создан
        this._db = new Database('./databases.db', { verbose: console.log });
    }

    close() {
        this._db.close()
    }

    // If any statement inside the transaction block throws, better-sqlite3 will rollback automatically.
    userRegisterTransaction(form:UserCreateForm): void {
        const transaction = this._db.transaction((form: UserCreateForm) => {
            this.userRegister(form) 
        });
        transaction(form);
    }

    userRegister(form: UserCreateForm): number {
        try {
            const stmt = this._db.prepare('INSERT INTO users (nickname, email, password) VALUES (?, ?, ?)');
            const result = stmt.run(form.nickname, form.email, form.hashedPassword);
            const userId = Number(result.lastInsertRowid);
            this._db.prepare('INSERT INTO ratings (user_id) VALUES (?)').run(userId)
            return (userId);
        } catch (error: any) {
            if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
              // This means nickname or email already exists (assuming there's a UNIQUE constraint)
              throw new Error('UserAlreadyExists');
            }
            throw new Error('DatabaseFailure');
          }
    }

    getUserByNickname(nickname: string): any {
        try {
            const user = this._db.prepare('SELECT * FROM users WHERE nickname = ?').get(nickname);
            return user;
        } catch (error) {
            console.error('User not found', error);
            throw new Error('Failed to get user');
        }
    }

};