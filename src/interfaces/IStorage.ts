
import UserBaseInfo from 'types/UserBaseInfo';
import UserCreateForm from '../models/UserCreateForm'
import RadishResponse from 'pkg/client/response';
import { InvitationStatus } from 'storage/DatabaseStorage';
import { InvitationListForm } from '../api/rest/publicHandlers/getInvitations';

// only signature of method
interface IStorage {
    userRegisterTransaction(form: UserCreateForm): number;
    userRegister(form: UserCreateForm) : number;

    // setters
    setUserUnavalible(userId: number): void;
    addUserAvatar(userId: number, relativePath: string): void;
    setUserPassword(userId: number, newPassword: string):Promise<void> ;
    createInvitation(senderId: number, recieverId: number): void;
    addFriends(firstUser:number, secondUser: number):void;



    //getters
    getUserByNickname(nickname: string): UserBaseInfo | undefined;
    getUserByEmail(email: string): UserBaseInfo | undefined ;
    getUserById(id: number) : UserBaseInfo;
    getUserAvatar(userId: number): string | undefined;
    getUserPassword(identifier: { nickname?: string; id?: number }): string;
    getEmailById(userId: number): string | undefined;
    getRatingLeadres(): Array<{ nickname: string, score: number }> | undefined;
    getInvitationsList(userId: number): InvitationListForm[] | undefined;

    // update
    updateNicknmae(userId: number, nickname: string): void;
    updatePassword(userId: number, oldPassword: string, newPassword: string): Promise<void>;
    updateRating(userId: number, newRating: number): void;
    updateRatingTransaction(ratings: { id: number; rating: number }[]): void;
    changeInvitationStatus(recordId: number, invitedUserId: number, status: InvitationStatus):void;
    getSender(recordId: number): number;


    //delete
    deleteUserAvatar(userId: number): void;
    deleteUser(userId: number): void;
    deleteFriend(userId: number, userToDelete: number): void;
};

export default IStorage
