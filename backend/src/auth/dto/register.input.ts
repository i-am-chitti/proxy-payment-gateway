import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsNumberString,
  IsPhoneNumber,
} from 'class-validator';

export class RegisterInput {
  @IsNotEmpty()
  @IsNumberString()
  @IsPhoneNumber('IN')
  phoneNumber: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
