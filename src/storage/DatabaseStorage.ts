import Database, { Database as DatabaseType } from "better-sqlite3";
import IStorage from '../interfaces/storage'

export default class DatabaseStorage implements IStorage {
    private _db: DatabaseType

    constructor() {
        //Работает как обычное подключение к SQLite-файлу если файл уже создан
        this._db = new Database('./databases.db', { verbose: console.log });
    }

    close() {
        this._db.close()
    }
    
    insertUserData(nickname: string, email: string, password: string): number {
        try {
            const stmt = this._db.prepare('INSERT INTO users (nickname, email, password) VALUES (?, ?, ?)');
            const result = stmt.run(nickname, email, password);
            const userId = Number(result.lastInsertRowid); // Ensure it's a number
            return (userId);
        } catch (error) {
            console.error('Error inserting user:', error);
            throw new Error('Failed to insert user');
        }
    }
    
    insertBasicRatingForUser(userId: number): void {
        try {
            const ratingInsert = this._db.prepare('INSERT INTO ratings (user_id) VALUES (?)')
            ratingInsert.run(userId)
        } catch (error) {
            console.error('Error inserting user rating:', error);
            throw new Error('Failed to insert user rating');
        }
    }



};