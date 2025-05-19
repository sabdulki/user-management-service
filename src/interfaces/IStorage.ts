
import UserBaseInfo from 'types/UserBaseInfo';
import UserCreateForm from '../models/UserCreateForm'

// only signature of method
interface IStorage {
    userRegisterTransaction(form: UserCreateForm): number;
    userRegister(form: UserCreateForm) : number;
    // inner methods
    getUserByNickname(nickname: string): UserBaseInfo | undefined;
    getUserByEmail(email: string): UserBaseInfo | undefined ;
    getUserById(id: number) : UserBaseInfo;
    addUserAvatar(userId: number, relativePath: string): void;
    getUserAvatar(userId: number): string | undefined;
    deleteUserAvatar(userId: number): void;
    updateNicknmae(userId: number, nickname: string): void;
    setUserUnavalible(userId: number): void;
    updateRating(userId: number, newRating: number): void;
    updateRatingTransaction(ratings: { id: number; rating: number }[]): void;
};

export default IStorage