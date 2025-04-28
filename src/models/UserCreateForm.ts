import { plainToInstance } from 'class-transformer';
import { IsEmail, IsString, MinLength, MaxLength, IsNotEmpty } from 'class-validator';
import bcrypt from 'bcryptjs';

// POST
class UserCreateForm {
    @IsString()
    nickname: string;
  
    @IsEmail()
    email: string;
  
    //  in JavaScript/TypeScript, setters are called whenever you assign a value to a property.
    private _password: string;
    @IsString()
    @MinLength(8)
    set password(value: string) {
      // Hash the password before storing it in the class
      const saltRounds = 10;
      bcrypt.hash(value, saltRounds)
        .then((hashedPassword) => {
          this._password = hashedPassword; // Store the hashed password
        })
        .catch((err) => {
          throw new Error('Error encrypting password: ' + err.message);
        });
    }
    // Getter to retrieve the hashed password
    get password(): string {
      return this._password;
  }
    constructor(nick: string, mail: string, pass: string) {
      this.nickname = nick;
      this.email = mail;
      this._password = '';
      this.password = pass; //equal to password(pass)
    }
};

   
export {
    UserCreateForm
};