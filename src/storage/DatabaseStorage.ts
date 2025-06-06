import Database, { Database as DatabaseType } from "better-sqlite3";
import IStorage from '../interfaces/IStorage'
import UserCreateForm from '../models/UserCreateForm'
import UserBaseInfo from "types/UserBaseInfo";
import bcrypt from "bcryptjs";
import { syncMigrations } from "./migrate";

export enum AuthProvider {
    LOCAL = 0,
    GOOGLE = 1
}

export default class DatabaseStorage implements IStorage {
    private _db: DatabaseType

    constructor() {
        //Работает как обычное подключение к SQLite-файлу если файл уже создан
        this._db = new Database('./db/database.db');
        syncMigrations(this._db, './db/migrations');
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

    getUserPassword(identifier: { nickname?: string; id?: number }): string {
        try {
            let query = '';
            let param: string | number;
    
            if (identifier.nickname) {
                query = 'SELECT password FROM users WHERE nickname = ?';
                param = identifier.nickname;
            } else if (identifier.id !== undefined) {
                query = 'SELECT password FROM users WHERE id = ?';
                param = identifier.id;
            } else {
                throw new Error('Must provide either nickname or id');
            }
    
            const result = this._db.prepare(query).get(param) as { password: string } | undefined;
    
            if (!result) {
                throw new Error('User not found');
            }
    
            return result.password;
    
        } catch (error) {
            throw new Error('Failed to get user info');
        }
    }

    getUserByNickname(nickname: string): UserBaseInfo | undefined {
        try {
            const user = this._db.prepare('SELECT * FROM users WHERE nickname = ?').get(nickname) as UserBaseInfo;
            if (!user)
                return undefined;
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
        let user;
        try {
            const stmt = this._db.prepare(`
                SELECT u.id, u.nickname, u.avatar, r.value as rating
                FROM users u
                JOIN ratings r ON u.id = r.user_id
                WHERE u.id = ? AND u.removed_at IS NULL
            `);
            user = stmt.get(id); 
        } catch (err: any) {
            throw new Error('Failed to get user');
        }

        if (!user) {
            throw new Error('UserNotFound');
        }
        return user as UserBaseInfo;
    }
    
    getEmailById(userId: number): string | undefined {
        const result = this._db.prepare('SELECT email FROM users WHERE id = ?').get(userId) as { email: string } | undefined;
        if (!result || !result.email)
            return undefined;
        return result.email;
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

    updateNicknmae(userId: number, nickname: string): void {
        const user = this.getUserByNickname(nickname);
        if (user)
            throw new Error('Nicknmae is already taken');
        try {
            const stmt = this._db.prepare('UPDATE users SET nickname = ? WHERE id = ?');
            stmt.run(nickname, userId);
        } catch (error: any) {
            throw new Error('Failed to update user nickname');
        }
    }

    getUserProvider(userId: number): number {
        const object = this._db.prepare('SELECT provider FROM users WHERE id = ?').get(userId) as { provider: number } | undefined ;
        if (!object) {
            throw new Error('UserNotFound');
        }
        return object.provider;
    }

    getRatingLeadres(): Array<{ nickname: string, score: number }> | undefined {
        try {
            const stmt = this._db.prepare(`
                SELECT u.nickname, r.value
                FROM ratings r
                JOIN users u ON u.id = r.user_id
                ORDER BY r.value DESC
                LIMIT 5
            `);
            const topPlayers = stmt.all() as { nickname: string, score: number }[];;
            return topPlayers;
        } catch (err: any) {
            console.log("error in db in getRatingLeadres", err);
            return undefined;
            // throw new Error ("Failed to get leaders");
        }
    }

    async setUserPassword(userId: number, newPassword: string): Promise<void> {
        try {
            const hashedNewPassword = await bcrypt.hash(newPassword, 10);
            const stmt = this._db.prepare('UPDATE users SET password = ? WHERE id = ?');
            stmt.run(hashedNewPassword, userId);
        } catch (error: any) {
            throw new Error('Failed to set user password');
        }
    }

    async updatePassword(userId: number, oldPassword: string, newPassword: string): Promise<void> {
        // get user, check if it's password is the same as old password
        // if true, hash new pass and update db
        // if false, throw error "Password is not correct", 403
        let currentPassword: string;
        try {
            currentPassword = this.getUserPassword({ id: userId });
        } catch (err: any) {
            throw new Error('Failed to get password');
        }

        const passwordMatches = await bcrypt.compare(oldPassword, currentPassword);
        if (!passwordMatches)
            throw new Error('Password is not correct');

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        try {
            const stmt = this._db.prepare('UPDATE users SET password = ? WHERE id = ?');
            stmt.run(hashedNewPassword, userId);
        } catch (error: any) {
            throw new Error('Failed to update user password');
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
            throw new Error('UserNotFound');
        }
        return object.avatar;
    }

    deleteUserAvatar(userId: number): void {
        try {
            this._db.prepare('UPDATE users SET avatar = NULL WHERE id = ?').run(userId);
        } catch (err:any) {
            console.log(err);
        }
    }

    deleteUser(userId: number): void {
        try {
            this._db.prepare('DELETE FROM users WHERE id = ?').run(userId);
        } catch (err:any) {
            console.log(err);
            throw new Error('Failed to delete user');
        }
    }


    setUserUnavalible(userId: number): void {
        try {
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
        const stmt = this._db.prepare(`
            SELECT 1 FROM users WHERE id = ? AND removed_at IS NULL
        `);
        const result = stmt.get(userId);
        return !!result; // true, если пользователь найден и не удалён
    }
      
};