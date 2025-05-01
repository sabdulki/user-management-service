
import UserCreateForm from '../models/UserCreateForm'

// only signature of method
interface IStorage {
    userRegister(form: UserCreateForm) : number;
    insertBasicRatingForUser(form: UserCreateForm): void;
    // inner methods
    getUserByNickname(nickname: string): any;
};

export default IStorage