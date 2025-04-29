
// only signature of method
interface IStorage {
    insertUserData(nickname: string, email:string, password: string) : number;
    insertBasicRatingForUser(userId: number): void;
};

export default IStorage