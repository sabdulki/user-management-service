import { plainToInstance } from 'class-transformer';
import { isNumber, validateOrReject } from 'class-validator';
import { IsEmail, IsString, MinLength, IsInt, IsIn, MaxLength, IsNotEmpty } from 'class-validator';
import bcrypt from 'bcryptjs';
import { AuthProvider } from 'storage/DatabaseStorage';

//  in JavaScript/TypeScript, setters are called whenever you assign a value to a property.

// POST
export default class UserCreateForm {
    @IsString()
    nickname: string;
  
    @IsEmail()
    email: string;
  
    @IsString()
    @MinLength(8)
    password: string;

    @IsInt()
    @IsIn([AuthProvider.LOCAL, AuthProvider.GOOGLE])
    provider: number;

    private _hashedPassword: string;

    get hashedPassword(): string {
      return this._hashedPassword;
    }
    constructor(nick: string, mail: string, pass: string, provider: AuthProvider = AuthProvider.LOCAL) {
      this.nickname = nick;
      this.email = mail;
      this.password = '';
      if (pass !== '')
        this._hashedPassword = pass;
      else
        this._hashedPassword = '';
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
