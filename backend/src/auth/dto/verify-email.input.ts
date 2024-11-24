import { IsEmail, IsNotEmpty, IsNumber } from 'class-validator';
import { CastToPositiveNumber } from 'src/environment/decorators/cast-to-positive-number';

export class VerifyEmailInput {
  @CastToPositiveNumber()
  @IsNotEmpty()
  @IsNumber()
  otp: number;

  @IsNotEmpty()
  @IsEmail()
  email: string;
}
