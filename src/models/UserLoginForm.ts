import { FastifyRequest, FastifyReply } from 'fastify'
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { IsEmail, IsString, MinLength, MaxLength, IsNotEmpty } from 'class-validator';
import bcrypt from 'bcryptjs';
import app from '../app'
import IStorage from 'interfaces/IStorage';

//  in JavaScript/TypeScript, setters are called whenever you assign a value to a property.

// POST
class UserLoginForm {
    @IsString()
    nickname: string;
    
    @IsString()
    @MinLength(8)
    rawPassword:string;
    // private _password :string;
    constructor(nick: string, pass: string) {
        this.nickname = nick;
        // this._password = pass;
        this.rawPassword = pass;
    }

    async authenticate(): Promise<boolean> {
        try {
          const userPassword = app.storage.getUserPassword(this.nickname) as string;
          const passwordMatches = await bcrypt.compare(this.rawPassword, userPassword);
      
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
          return new UserLoginForm(form.nickname, form.rawPassword)
        } catch (errors) {
          // which status code should be and how errors should be treated?
          throw new Error("Invalid data");
        }
    }
};

export {
    UserLoginForm
};