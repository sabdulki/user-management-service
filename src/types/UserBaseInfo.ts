type UserBaseInfo = {
    id: number;
    nickname: string;
    rating: number;
    avatar: string | null;
    removed_at: number | null;
    isOnline: boolean;
};

export default UserBaseInfo