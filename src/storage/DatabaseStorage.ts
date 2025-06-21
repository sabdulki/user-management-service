import Database, { Database as DatabaseType } from "better-sqlite3";
import IStorage from '../interfaces/IStorage'
import UserCreateForm from '../models/UserCreateForm'
import UserBaseInfo from "types/UserBaseInfo";
import bcrypt from "bcryptjs";
import { syncMigrations } from "./migrate";
import { InvitationListForm } from "../api/rest/publicHandlers/friends/getInvitations";
import Config from "../config/Config";

export enum AuthProvider {
    LOCAL = 0,
    GOOGLE = 1
}

export enum InvitationStatus {
    ACCEPT = 0,
    REJECT = 1
}

export enum StateValue {
    OFFLINE = 0,
    ONLINE = 1,
}

// export const StateValue = {
//     OFFLINE: false,
//     ONLINE: true,
// } as const;
  
// export type StateValue = typeof StateValue[keyof typeof StateValue];

export default class DatabaseStorage implements IStorage {
    private _db: DatabaseType

    constructor() {
        //Работает как обычное подключение к SQLite-файлу если файл уже создан
        let dbPath: string;
        let migrationsPath: string;
        if (Config.getInstance().getMode() === "develop") {
            dbPath = './db/database.db'
            migrationsPath = './db/migrations'
        } else {
            dbPath = '/app/db/database.db'
            migrationsPath = '/app/db/migrations'
        }
        this._db = new Database(dbPath);
        syncMigrations(this._db, migrationsPath);
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
        try {
            const user = this._db.prepare('SELECT * FROM users WHERE email = ?').get(email) as UserBaseInfo;
            if (!user)
                return undefined;
            const userId = user.id;
            return this.getUserById(userId);
        } catch (error:any) {
            if (error.message === "UserNotFound")
                throw new Error('UserNotFound');
            throw new Error('Failed to get user');
        }
    }

    getUserById(id: number): UserBaseInfo {
        let user;
        try {
            const stmt = this._db.prepare(`
                SELECT u.id, u.nickname, u.avatar, u.is_online AS isOnline, r.value as rating
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

    // getUserById(id: number): UserBaseInfo {
    //     let user: any;
    //     try {
    //         const stmt = this._db.prepare(`
    //             SELECT u.id, u.nickname, u.avatar, u.is_online, u.removed_at, r.value as rating
    //             FROM users u
    //             JOIN ratings r ON u.id = r.user_id
    //             WHERE u.id = ?
    //         `);
    //         user = stmt.get(id); 
    //     } catch (err: any) {
    //         throw new Error('DatabaseFailure');
    //     }
    
    //     if (!user) { // if user doesn't exist
    //         throw new Error('UserNotFound');
    //     }
    
    //     if (user.removed_at !== null) {
    //         throw new Error('UserIsRemoved');
    //     }
    
    //     return user as UserBaseInfo;
    // }
    
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
        console.log("object: ", object, ", object.provider: ", object?.provider);
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
                 WHERE u.removed_at IS NULL
                ORDER BY r.value DESC
                LIMIT 5
            `);
            const topPlayers = stmt.all() as { nickname: string, score: number }[];
            console.log("topPlayers:", topPlayers);
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
            console.log("relativePath in db: ", relativePath);
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
            const removedAt = Math.floor(Date.now() / 1000)
            const stmt = this._db.prepare('UPDATE users SET removed_at = ? WHERE id = ?');
            const result = stmt.run(removedAt, userId);
        
            if (result.changes === 0) {
                throw new Error("User not found");
            }
        } catch (error) {
            throw new Error('Failed to delete user');
        }
    }
    
    // it return false, if user doesn't exist ot removed_at IS NOT NULL
    // !!{} → true
    // !!undefined → false
    isUserAvailable(userId: number): boolean {
        // Оператор !! преобразует значение в логическое: true, если объект существует, и false, если нет.
        const stmt = this._db.prepare(`
            SELECT 1 FROM users WHERE id = ? AND removed_at IS NULL
        `);
        const result = stmt.get(userId);
        return !!result; // true, если пользователь найден и не удалён
    }
    

    createInvitationTransaction(senderId: number, receiverId: number): number {

        const [userA, userB] = [senderId, receiverId].sort((a, b) => a - b); // for friends check

        const txn = this._db.transaction(() => {
        // 🔍 Проверка на уже существующее активное приглашение
            const existing = this._db.prepare(`
                SELECT 1 FROM invitations
                WHERE ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))
                  AND status IS NULL
                  AND disabled_at IS NULL
            `).get(senderId, receiverId, receiverId, senderId);

            if (existing) {
                throw new Error('Invitation already exists');
            }

            // 🔍 Проверка, не являются ли уже друзьями
            const friendship = this._db.prepare(`
                SELECT 1 FROM friends
                WHERE user_a = ? AND user_b = ?
            `).get(userA, userB);

            if (friendship) {
                throw new Error('Already friends');
            }

            // ✅ Вставка
            const result = this._db.prepare(`
                INSERT INTO invitations (sender_id, receiver_id) VALUES (?, ?)
            `).run(senderId, receiverId);

            return result.lastInsertRowid as number;
        });

        try {
            return txn();
        } catch(error: any) {
            if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
                throw new Error('User not found');
            } else {
                throw error;
            } 
        }
    }

    changeInvitationStatus(recordId: number, invitedUserId: number, status: InvitationStatus):void {

        const object = this._db.prepare(
            'SELECT status, sender_id AS senderId FROM invitations WHERE id = ? AND status IS NULL AND disabled_at IS NULL'
        ).get(recordId) as { status: number, senderId: number } | undefined ;
        if (!object || object.status === undefined || object.senderId === undefined){
            console.log("object: ", object, "object.status: ", object?.status, "object.senderId: ", object?.senderId)
            throw new Error('Invitation not found');
        }
        try {
            this._db.prepare(
                'UPDATE invitations SET status = ? WHERE (id = ? AND receiver_id = ? AND sender_id = ? AND disabled_at IS NULL)'
            ).run(status, recordId, invitedUserId, object.senderId);
        } catch (err:any) {
            throw new Error('DatabaseFailure');
        }
    }

    addFriends(firstUser:number, secondUser: number):void {
        const [userA, userB] = [firstUser, secondUser].sort((a, b) => a - b);
        try {
            console.log("about to add friends: userA: ", userA, ", userB:", userB);
            this._db.prepare(
                'INSERT INTO friends (user_a, user_b) VALUES (?, ?)'
            ).run(userA, userB);
        } catch (error: any) {
            console.log(error);
            if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
              throw new Error('User not found');
            } else if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
              throw new Error('Record already exists');
            } else {
              console.error('Other database error:', error.message);
              throw new Error('DatabaseFailure');
            }
        }
    }

    getSender(recordId: number): number {
        const object = this._db.prepare(
            'SELECT sender_id  AS senderId FROM invitations WHERE id = ?'
        ).get(recordId) as { senderId: number } | undefined ;
        if (!object)
            throw new Error('DatabaseFailure');
        console.log(object);
        if (!object.senderId)
            throw new Error('User not found');

        return object.senderId;
    }

    getFriendsList(issuerId: number): undefined | UserBaseInfo[] {
        let friends: UserBaseInfo[] | undefined;
        try {
            const stmt = this._db.prepare(`
                SELECT
                    u.id,
                    u.nickname,
                    u.avatar,
                    u.is_online,
                    u.removed_at,
                    r.value AS rating
                FROM users u
                JOIN ratings r ON u.id = r.user_id
                WHERE u.id IN (
                    SELECT
                    CASE
                        WHEN user_a = ? THEN user_b
                        ELSE user_a
                    END
                    FROM friends
                    WHERE user_a = ? OR user_b = ?
                )
            `);
            const rawRows = stmt.all(issuerId, issuerId, issuerId);
            friends = rawRows.map((row: any) => ({
                id: row.id,
                nickname: row.nickname,
                avatar: row.avatar,
                removed_at: row.removed_at,
                rating: row.rating,
                isOnline: Boolean(row.is_online),
              })) as UserBaseInfo[];
            console.log(friends);
            return friends;
        } catch (err:any) {
            throw new Error('DatabaseFailure');
        }
    }
    
    getInvitationId(user1: number, user2: number): number {
        try {
            const result = this._db.prepare(`
                SELECT id AS recordId FROM invitations
                WHERE ((sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?))
                AND disabled_at IS NULL
            `).get(user1, user2, user2, user1) as { recordId: number } | undefined;
            if (!result || !result.recordId)
                throw new Error('Failed to get invitation');
            console.log("recordId: ", result.recordId);
            return result.recordId;
        } catch(error:any) {
            throw new Error('Failed to get invitation');
        }
    }

    disableInvitation(recordId: number): void {
        try {
            const disabledAt = Math.floor(Date.now() / 1000)
            const stmt = this._db.prepare('UPDATE invitations SET disabled_at = ? WHERE id = ? AND disabled_at IS NULL');
            const result = stmt.run(disabledAt, recordId);
        
            if (result.changes === 0) {
                throw new Error('Record not found');
            }
        } catch (error: any) {
            throw new Error('Failed to disable invitation');
        }
    }

    deleteFriendTransaction(userId: number, userToDelete: number): void{
        const tnx = this._db.transaction(() => {
            this.deleteFriend(userId, userToDelete);
            const recordId = this.getInvitationId(userId, userToDelete);
            this.disableInvitation(recordId);
        });

        try {
            tnx();
        } catch (error: any) {
            throw error;
        }
            // if (error.message === 'User not found') {
            //     throw new Error('User not found');
            // } else if (error.message === 'No such friendship exists') {
            //     throw new Error('User not found');
            // } else if (error.message === 'Failed to get invitation') {
            //     throw new Error('Failed to get invitation');
            // } else if (error.message === 'Failed to disable invitation') {
            //     throw new Error('Failed to disable invitation');
            // } else {
            //     console.error('Failed to remove friend:', error.message);
            //     throw new Error('DatabaseFailure');
            // }
    }

    deleteFriend(userId: number, userToDelete: number): void {
        const [userA, userB] = [userId, userToDelete].sort((a, b) => a - b);
        try {
            const stmt = this._db.prepare(
                'DELETE FROM friends WHERE user_a = ? AND user_b = ?'
            );
            const result = stmt.run(userA, userB);
        
            if (result.changes === 0) {
              throw new Error('No such friendship exists');
            }
        } catch (error: any) {
            if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
                throw new Error('User not found');
            } else {
                throw error;
            }
        }
    }

    getInvitationsList(userId: number): InvitationListForm[] | undefined{
        let invitations: InvitationListForm[] | undefined;
        try {
            const stmt = this._db.prepare(`
                SELECT 
                  i.id AS recordId,
                  i.sender_id AS senderId,
                  CASE 
                    WHEN i.sender_id = ? THEN u.nickname  
                    ELSE u.nickname
                  END AS nickname
                FROM invitations i
                JOIN users u 
                  ON u.id = CASE 
                              WHEN i.sender_id = ? THEN i.receiver_id
                              ELSE i.sender_id
                            END
                WHERE (i.sender_id = ? OR i.receiver_id = ?)
                AND i.status IS NULL
                AND i.disabled_at IS NULL
              `);
              
            const rows = stmt.all(userId, userId, userId, userId);
            invitations = rows as InvitationListForm[];
            console.log(invitations);
            return invitations;
        } catch (err:any) {
            throw new Error('DatabaseFailure');
        }

    }

    deleteInvitationRecordTransaction(recordId: number): void {
        const deletingTransaction = this._db.transaction(() => {
            // Step 1: Get the invitation
            const invitation = this._db.prepare(
                'SELECT sender_id, receiver_id, status FROM invitations WHERE id = ?'
            ).get(recordId) as { sender_id: number; receiver_id: number; status: number | null } | undefined;
    
            if (!invitation) {
                throw new Error('Invitation not found');
            }
    
            // Step 2: If accepted (status === 0), delete friendship
            if (invitation.status === 0) {
                const [userA, userB] = [invitation.sender_id, invitation.receiver_id].sort((a, b) => a - b);
                this._db.prepare(
                    'DELETE FROM friends WHERE user_a = ? AND user_b = ?'
                ).run(userA, userB);
            }
    
            // Step 3: Delete the invitation
            this._db.prepare('DELETE FROM invitations WHERE id = ?').run(recordId);
        });

        deletingTransaction();
    }

    acceptInvitationAndAddFriendsTransaction(recordId: number, invitedUserId: number): UserBaseInfo {
        const transaction = this._db.transaction(() => {
            this.changeInvitationStatus(recordId, invitedUserId, InvitationStatus.ACCEPT);
            const senderId = this.getSender(recordId);
            this.addFriends(senderId, invitedUserId);
            const userBaseInfo = this.getUserById(senderId) as UserBaseInfo;
            if (!userBaseInfo)
                throw new Error ("DatabaseFailure");
            return userBaseInfo;
        });
    
        return transaction(); // run the transaction
    }


    rejectInvitationTransaction(recordId: number, invitedUserId: number): void {
        const transaction = this._db.transaction(() => {
            this.changeInvitationStatus(recordId, invitedUserId, InvitationStatus.REJECT);
            this.disableInvitation(recordId);
        });
        transaction();
    }

    changeUserState(userId: number, state: StateValue):void {
        console.log('Changing state for userId:', userId, 'to:', state);
        try {
            this._db.prepare(
               'UPDATE users SET is_online = ? WHERE id = ? AND removed_at IS NULL'
            ).run(state, userId);
        } catch (err:any) {
            throw new Error('DatabaseFailure');
        }
    }
};