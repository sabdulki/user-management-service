import { FastifyRequest, FastifyReply } from 'fastify'
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { IsEmail, IsString, MinLength, MaxLength, IsNotEmpty } from 'class-validator';
import bcrypt from 'bcryptjs';

//  in JavaScript/TypeScript, setters are called whenever you assign a value to a property.

// POST
class UserCreateForm {
    @IsString()
    nickname: string;
  
    @IsEmail()
    email: string;
  
    @IsString()
    @MinLength(8)
    password: string;

    private _hashedPassword: string;

    get hashedPassword(): string {
      return this._hashedPassword;
    }
    constructor(nick: string, mail: string, pass: string) {
      this.nickname = nick;
      this.email = mail;
      this.password = '';
      this._hashedPassword = pass;
    }

    static async create(rawData: unknown): Promise <UserCreateForm> {
        const form = plainToInstance(UserCreateForm, rawData);
        try {
          await validateOrReject(form);
        } catch (errors) {
          throw new Error(`Validation failed: ${JSON.stringify(errors)}`);
        }

        try {
          const hashed = await bcrypt.hash(form.password, 10);
          return new UserCreateForm(form.nickname, form.email, hashed);
        } catch (hashError) {
          throw new Error('Password hashing failed');
        }
    }
};

export {
  UserCreateForm
};