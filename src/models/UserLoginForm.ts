import { FastifyRequest, FastifyReply } from 'fastify'
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { IsEmail, IsString, MinLength, MaxLength, IsNotEmpty } from 'class-validator';
import bcrypt from 'bcryptjs';
import IStorage from 'interfaces/storage';

//  in JavaScript/TypeScript, setters are called whenever you assign a value to a property.

// POST
class UserLoginForm {
    constructor(
        private readonly nickname: string,
        private readonly password: string,
        private readonly storage: IStorage
    ) {}

    async authenticate(): Promise<{ user: any } | null> {
        const user = this.storage.getUserByNickname(this.nickname) as any;
        if (!user) return null;

        const passwordMatches = await bcrypt.compare(this.password, user.password);
        if (!passwordMatches) return null;

        return {user}; // or the full user object if needed
    }
};

export {
    UserLoginForm
};