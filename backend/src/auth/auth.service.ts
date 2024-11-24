import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterInput } from './dto/register.input';
import { LoginInput } from './dto/login.input';
import { OTPActions } from 'src/otp/otp.entity';
import { OtpService } from 'src/otp/otp.service';
import { VerifyEmailInput } from './dto/verify-email.input';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private otpService: OtpService,
  ) {}

  async signIn(loginInput: LoginInput) {
    const user = await this.usersService.challenge(loginInput);
    if (!user) {
      throw new UnauthorizedException();
    }

    const payload = {
      sub: user.id,
      email: user.email,
      phoneNumber: user.phoneNumber,
    };

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async signUp(user: RegisterInput) {
    const newUser = await this.usersService.create(user);

    this.otpService.sendOTPToMail(
      OTPActions.VERIFY_EMAIL,
      newUser,
      'OTP: Verify Email',
    );

    return newUser;
  }

  async verifyEmail(verifyEmailDto: VerifyEmailInput) {
    const user = await this.usersService.findOneByEmail(verifyEmailDto.email);
    if (!user) {
      throw new UnauthorizedException();
    }

    const otp = await this.otpService.validateOtp(
      OTPActions.VERIFY_EMAIL,
      verifyEmailDto.otp,
      user,
    );

    await this.otpService.deleteOtp(otp);

    await this.usersService.updateUserEmailVerified(otp.user);
    return {
      message: 'Email verified successfully',
    };
  }
}
