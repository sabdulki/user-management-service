import { FastifyRequest, FastifyReply } from 'fastify'
import { plainToInstance } from 'class-transformer';
import { Matches, validateOrReject } from 'class-validator';
import { IsEmail, IsString, MinLength, MaxLength, IsNotEmpty } from 'class-validator';
import bcrypt from 'bcryptjs';
import app from '../app'
import IStorage from 'interfaces/IStorage';
import { MAX_NICKNAME_LENGTH, NICKNAME_REGEX } from '../api/rest/publicHandlers/auth/registration';

//  in JavaScript/TypeScript, setters are called whenever you assign a value to a property.

// POST
class UserLoginForm {
  @IsString()
  @Matches(NICKNAME_REGEX, { message: 'Nickname must contain only lowercase letters, numbers, or underscores' })
  @MaxLength(MAX_NICKNAME_LENGTH, { message: 'Nickname must be at most 12 characters long' })
  nickname: string;
    
  @IsString()
  @MinLength(8)
  password:string;
  // private _password :string;
  constructor(nick: string, pass: string) {
      this.nickname = nick;
      // this._password = pass;
      this.password = pass;
  }

  async authenticate(): Promise<boolean> {
      try {
        const userPassword = app.storage.getUserPassword({nickname: this.nickname}) as string;
        const passwordMatches = await bcrypt.compare(this.password, userPassword);
    
        return passwordMatches; // return true if match, false otherwise
      } catch (error) {
        console.error('Authentication failed:', error);
        return false;
      }
  }      

  static async create(rawData: unknown): Promise <UserLoginForm> {
      const form = plainToInstance(UserLoginForm, rawData);
      try {
        await validateOrReject(form);
        return new UserLoginForm(form.nickname, form.password)
      } catch (errors) {
        throw new Error("Invalid data");
      }
  }
};

export {
    UserLoginForm
};