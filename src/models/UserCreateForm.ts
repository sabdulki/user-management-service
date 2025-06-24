import { plainToInstance } from 'class-transformer';
import { validateOrReject, IsEmail, IsString, MinLength, IsInt, IsIn, ValidateIf, Matches, MaxLength } from 'class-validator';
import bcrypt from 'bcryptjs';
import { AuthProvider } from './../storage/DatabaseStorage';
import { MAX_NICKNAME_LENGTH, NICKNAME_REGEX } from '../api/rest/publicHandlers/auth/registration';

//  in JavaScript/TypeScript, setters are called whenever you assign a value to a property.

// POST
export default class UserCreateForm {
    @IsInt()
    @IsIn([AuthProvider.LOCAL, AuthProvider.GOOGLE])
    provider: number;

    @IsString()
    @Matches(NICKNAME_REGEX, { message: 'Nickname must contain only lowercase letters, numbers, or underscores' })
    @MaxLength(MAX_NICKNAME_LENGTH, { message: 'Nickname must be at most 12 characters long' })
    nickname: string;
  
    @IsEmail()
    email: string;

    @ValidateIf((obj) => obj.provider === AuthProvider.LOCAL)
    @IsString()
    @MinLength(8)
    password: string;

    public readonly hashedPassword: string;

    constructor(nick: string, mail: string, pass: string, provider: AuthProvider = AuthProvider.LOCAL) {
      this.nickname = nick;
      this.email = mail;
      this.password = '';
      this.hashedPassword = pass;
      this.provider = provider;
    }

    static async create(rawData: unknown): Promise <UserCreateForm> {
      const data = rawData as { [key: string]: any };
      const form = plainToInstance(UserCreateForm, data);
      try {
        await validateOrReject(form);
      } catch (errors) {
        // which status code should be and how errors should be treated?
        throw new Error('Invalid data');
      }

      try {
        let hashed: string;
        hashed = '';
        if (form.password) {
          hashed = await bcrypt.hash(form.password, 10);
        }
        // Установи provider, если есть в rawData, иначе — LOCAL
        const provider: AuthProvider = data.provider ?? AuthProvider.LOCAL;
        return new UserCreateForm(form.nickname, form.email, hashed, provider);
      } catch (hashError) {
        throw new Error('Operation failed');
      }
    }
};
