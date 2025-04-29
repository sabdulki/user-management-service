import Database, { Database as DatabaseType } from "better-sqlite3";

export default class DatabaseStorage implements IStorage {
    private _db: DatabaseType

    constructor(path: string) {
        this._db = new Database('./databases.db', { verbose: console.log });
    }

    close() {
        this._db.close()
    }
    
    insertUserData(nickname: string, email: string, password: string): void {
        try {
            const stmt = this._db.prepare('INSERT INTO users (nickname, email, password) VALUES (?, ?, ?)');
            const result = stmt.run(nickname, email, password);
            const userId = Number(result.lastInsertRowid); // Ensure it's a number
    
            this.insertBasicRatingForUser(userId); // Call the separated method
        } catch (error) {
            console.error('Error inserting user:', error);
            throw new Error('Failed to insert user');
        }
    }
    
    insertBasicRatingForUser(userId: number) {
        try {
            const ratingInsert = this._db.prepare('INSERT INTO ratings (user_id) VALUES (?)')
            ratingInsert.run(userId)
        } catch (error) {
            console.error('Error inserting user rating:', error);
            throw new Error('Failed to insert user rating');
        }
    }



};