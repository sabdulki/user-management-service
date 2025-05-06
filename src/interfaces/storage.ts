
import UserBaseInfo from 'types/UserBaseInfo';
import UserCreateForm from '../models/UserCreateForm'

// only signature of method
interface IStorage {
    userRegisterTransaction(form: UserCreateForm): number;
    userRegister(form: UserCreateForm) : number;
    // inner methods
    getUserByNickname(nickname: string): UserBaseInfo;
    getUserById(id: number) : UserBaseInfo;
};

export default IStorage