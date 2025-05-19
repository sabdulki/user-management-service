
import UserBaseInfo from 'types/UserBaseInfo';
import UserCreateForm from '../models/UserCreateForm'

// only signature of method
interface IStorage {
    userRegisterTransaction(form: UserCreateForm): number;
    userRegister(form: UserCreateForm) : number;
    // inner methods
    getUserByNickname(nickname: string): UserBaseInfo;
    getUserByEmail(email: string): UserBaseInfo | undefined ;
    getUserById(id: number) : UserBaseInfo;
    addUserAvatar(userId: number, relativePath: string): void;
    getUserAvatar(userId: number): string | undefined;
    deleteUserAvatar(userId: number): void;
    setUserUnavalible(userId: number): void;
};

export default IStorage