
import UserBaseInfo from 'types/UserBaseInfo';
import UserCreateForm from '../models/UserCreateForm'
import RadishResponse from 'pkg/cache/client/response';
import { InvitationStatus, StateValue } from '../storage/DatabaseStorage';
import { InvitationListForm } from '../api/rest/publicHandlers/friends/getInvitations';

// only signature of method
interface IStorage {

    // transactions
    acceptInvitationAndAddFriendsTransaction(recordId: number, invitedUserId: number): UserBaseInfo;
    userRegisterTransaction(form: UserCreateForm): number;
    userRegister(form: UserCreateForm) : number;
    createInvitationTransaction(senderId: number, receiverId: number): number;
    updateRatingTransaction(ratings: { id: number; rating: number }[]): void;
    rejectInvitationTransaction(recordId: number, invitedUserId: number): void;
    deleteInvitationRecordTransaction(recordId: number): void;
    deleteFriendTransaction(userId: number, userToDelete: number): void;
    setUserUnavalibleTransaction(userId: number): void ;


    // setters
    setUserUnavalible(userId: number): void;
    addUserAvatar(userId: number, relativePath: string): void;
    setUserPassword(userId: number, newPassword: string):Promise<void> ;
    addFriends(firstUser:number, secondUser: number):void;
    changeUserState(userId: number, state: StateValue):void;


    //getters
    getUserByNickname(nickname: string): UserBaseInfo | undefined;
    getUserByEmail(email: string): UserBaseInfo | undefined ;
    getUserById(id: number) : UserBaseInfo;
    getUserAvatar(userId: number): string | undefined;
    getUserPassword(identifier: { nickname?: string; id?: number }): string;
    getEmailById(userId: number): string | undefined;
    getRatingLeadres(): Array<{ nickname: string, score: number }> | undefined;
    getInvitationsList(userId: number): InvitationListForm[] | undefined;
    getInvitationId(user1: number, user2: number): number;
    getFriendsList(issuerId: number): undefined | UserBaseInfo[] ;
    getUserProvider(userId: number): number | undefined;
    hasUserPassword(userId: number): boolean;

    // update
    updateNicknmae(userId: number, nickname: string): void;
    updatePassword(userId: number, oldPassword: string, newPassword: string): Promise<void>;
    updateRating(userId: number, newRating: number): void;
    changeInvitationStatus(recordId: number, invitedUserId: number, status: InvitationStatus):void;
    getSender(recordId: number): number;


    //delete
    deleteUserAvatar(userId: number): void;
    deleteUser(userId: number): void;
    deleteFriend(userId: number, userToDelete: number): void;
    disableInvitation(recordId: number): void ;
};

export default IStorage
