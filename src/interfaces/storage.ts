
// only signature of method
interface IStorage {
    insertUserData(nickname: string, email:string, password: string) : number;
    insertBasicRatingForUser(userId: number): void;
    getUserByNickname(nickname: string): any;
};

export default IStorage