import Database, { Database as DatabaseType } from "better-sqlite3";
import IStorage from '../interfaces/IStorage'
import UserCreateForm from '../models/UserCreateForm'
import UserBaseInfo from "types/UserBaseInfo";

export enum AuthProvider {
    LOCAL = 0,
    GOOGLE = 1
}

export default class DatabaseStorage implements IStorage {
    private _db: DatabaseType

    constructor() {
        //Работает как обычное подключение к SQLite-файлу если файл уже создан
        this._db = new Database('./databases.db');
        // this was executed on;y ONCE to add avatar column ONLY
        // const columnExists = this._db
        //     .prepare(`PRAGMA table_info(users)`)
        //     .all()
        //     .some(col => col.name === 'provider')

        // if (!columnExists) {
            // this._db.exec(`ALTER TABLE users ADD COLUMN removed_at INTEGER DEFAULT null;`)
            // this._db.exec(`ALTER TABLE users RENAME COLUMN avatar_path TO avatar;`)

        // }
    }

    close() {
        this._db.close()
    }

    // If any statement inside the transaction block throws, better-sqlite3 will rollback automatically.
    userRegisterTransaction(form:UserCreateForm): number {
        const transaction = this._db.transaction((form: UserCreateForm) => {
            return this.userRegister(form) 
        });
        return transaction(form);
    }

    userRegister(form: UserCreateForm): number {
        try {
            let result: any;
            const stmt = this._db.prepare('INSERT INTO users (nickname, email, password, provider) VALUES (?, ?, ?, ?)');
            result = stmt.run(form.nickname, form.email, form.hashedPassword, form.provider);
            const userId = Number(result.lastInsertRowid);
            this._db.prepare('INSERT INTO ratings (user_id) VALUES (?)').run(userId)
            return (userId);
        } catch (error: any) {
            if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
              // This means nickname or email already exists (assuming there's a UNIQUE constraint)
              throw new Error('UserAlreadyExists');
            }
            console.log('DatabaseFailure', error)
            throw new Error('DatabaseFailure');
            
          }
    }

    getUserPassword(nickname: string): string {
        try {
            const object = this._db.prepare('SELECT password FROM users WHERE nickname = ?').get(nickname) as { password: string } | undefined ;
            if (!object) {
                throw new Error('User not found');
            }
            return object.password;
        } catch (error) {
            throw new Error('Failed to get user info');
        }
    }

    getUserByNickname(nickname: string): UserBaseInfo {
        try {
            const user = this._db.prepare('SELECT * FROM users WHERE nickname = ?').get(nickname) as UserBaseInfo;
            const userId = user.id;
            return this.getUserById(userId);
        } catch (error) {
            throw new Error('Failed to get user');
        }
    }

    getUserByEmail(email: string): UserBaseInfo | undefined {
        // try {
            const user = this._db.prepare('SELECT * FROM users WHERE email = ?').get(email) as UserBaseInfo;
            if (!user)
                return undefined;
            const userId = user.id;
            return this.getUserById(userId);
        // } catch (error) {
        //     throw new Error('Failed to get user');
        // }
    }

    getUserById(id: number): UserBaseInfo {
        try {
            const stmt = this._db.prepare(`
                SELECT u.id, u.nickname, u.avatar, u.removed_at, r.value as rating
                FROM users u
                JOIN ratings r ON u.id = r.user_id
                WHERE u.id = ?
            `);
            const user = stmt.get(id);
    
            if (!user) {
                throw new Error('UserNotFound');
            }
            return user as UserBaseInfo;
        } catch (error: any) {
            if (error.message === 'UserNotFound') {
                throw error; // пробрасываем специфическую ошибку выше
            }
            throw new Error('Failed to get user');
        }
    }
    
    updateRatingTransaction(ratings: { id: number; rating: number }[]): void {
        const transaction = this._db.transaction((ratings: { id: number; rating: number }[]) => {
            for (const { id, rating } of ratings) {
                this.updateRating(id, rating);
            }
        });
    
        transaction(ratings); 
    }

    updateRating(userId: number, newRating: number): void {
        try {
            const user = this.getUserById(userId) as UserBaseInfo;
            const stmt = this._db.prepare('UPDATE ratings SET value = ? WHERE user_id = ?');
            stmt.run(newRating, user.id);
        } catch (error: any) {
            throw new Error('Failed to update user rating');
        }
    }

    addUserAvatar(userId: number, relativePath: string): void {
        try {
            const stmt = this._db.prepare('UPDATE users SET avatar = ? WHERE id = ?');
            stmt.run(relativePath, userId) 
        } catch (error: any) {
            throw new Error('Failed to add user avatar');
        }
    }

    getUserAvatar(userId: number): string | undefined {
        const object = this._db.prepare('SELECT avatar FROM users WHERE id = ?').get(userId) as { avatar: string } | undefined ;
        if (!object) {
            throw new Error('UserNotFound');;
        }
        return object.avatar;
    }

    deleteUserAvatar(userId: number): void {
        this._db.prepare('UPDATE users SET avatar = NULL WHERE id = ?').run(userId);
    }

    setUserUnavalible(userId: number): void {
        try {
            // const stmt = this._db.prepare('DELETE FROM users WHERE id = ?');
            const removed_at = Date.now();
            const stmt = this._db.prepare('UPDATE users SET removed_at = ? WHERE id = ?');
            const result = stmt.run(removed_at, userId);
        
            if (result.changes === 0) {
                throw new Error("User not found");
            }
        } catch (error) {
            throw new Error('Failed to delete user');
        }
    }
    
    isUserAvailable(userId: number): boolean {
        // Оператор !! преобразует значение в логическое: true, если объект существует, и false, если нет.
        const user = this.getUserById(userId);
        return !!user && user.removed_at === null;
    }
      
};