
import UserCreateForm from '../models/UserCreateForm'

// only signature of method
interface IStorage {
    userRegisterTransaction(form: UserCreateForm): void;
    userRegister(form: UserCreateForm) : number;
    // inner methods
    getUserByNickname(nickname: string): any;
};

export default IStorage