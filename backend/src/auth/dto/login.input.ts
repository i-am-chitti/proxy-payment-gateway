import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginInput {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
