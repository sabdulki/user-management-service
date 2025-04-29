import { FastifyRequest, FastifyReply } from 'fastify'
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { IsEmail, IsString, MinLength, MaxLength, IsNotEmpty } from 'class-validator';
import bcrypt from 'bcryptjs';

//  in JavaScript/TypeScript, setters are called whenever you assign a value to a property.

// POST
class UserCreateForm {
    @IsString()
    _nickname: string;
  
    @IsEmail()
    _email: string;
  
    @IsString()
    @MinLength(8)
    _password: string;

    private _hashedPassword: string;

    get password(): string {
      return this._hashedPassword;
  }
    constructor(nick: string, mail: string, pass: string) {
      this._nickname = nick;
      this._email = mail;
      this._password = '';
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
          return new UserCreateForm(form._nickname, form._email, hashed);
        } catch (hashError) {
          throw new Error('Password hashing failed');
        }
    }
};

export {
  UserCreateForm
};