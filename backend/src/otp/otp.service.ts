import { HttpException, Injectable } from '@nestjs/common';
import { User } from 'src/users/user.entity';
import { OTP, OTPActions } from './otp.entity';
import { Repository } from 'typeorm';
import { MailerService } from '@nestjs-modules/mailer';
import { InjectRepository } from '@nestjs/typeorm';
import { EnvironmentService } from 'src/environment/environment.service';
import { addMinutes, isPast } from 'date-fns';

@Injectable()
export class OtpService {
  constructor(
    private readonly environmentService: EnvironmentService,
    private readonly mailerService: MailerService,
    @InjectRepository(OTP) private readonly otpRepository: Repository<OTP>,
  ) {}
  generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendOTPToMail(
    action: OTPActions,
    user: User,
    subject?: string,
    expiry?: Date,
  ): Promise<void> {
    const otp = await this.saveOtp(action, user, expiry);

    await this.mailerService.sendMail({
      to: otp.user.email,
      from: this.environmentService.get('MAILER_USER'),
      subject: subject || 'OTP Verification',
      text: `Your OTP is ${otp.otp}`,
    });
  }

  async saveOtp(action: string, user: User, expiry?: Date): Promise<OTP> {
    const isOtpExists = await this.checkIfOTPActionExists(action, user);
    if (isOtpExists) {
      throw new HttpException('OTP already exists', 400);
    }

    const otpString = this.generateOtp();

    const otpEntity = new OTP();
    otpEntity.otp = otpString;
    otpEntity.action = action;
    otpEntity.user = user;
    otpEntity.expiryAt =
      expiry ||
      addMinutes(
        new Date(),
        this.environmentService.get('OTP_VALIDITY_MINUTES') || 5,
      );
    const savedTOP = await this.otpRepository.save(otpEntity);
    return savedTOP;
  }

  async checkIfOTPActionExists(action: string, user: User): Promise<boolean> {
    const otp = await this.otpRepository.findOne({
      where: { user, action },
    });

    if (!otp) {
      return false;
    }

    if (isPast(otp.expiryAt)) {
      // Expired OTP, can regenerate
      this.otpRepository.delete(otp.id);
    } else {
      return true;
    }
  }

  async validateOtp(action: string, otp: number, user: User): Promise<OTP> {
    const otpEntity = await this.otpRepository.findOne({
      where: { otp: otp.toString(), action },
      relations: {
        user: true,
      },
    });

    // @TODO Limit the number of attempts.

    if (!otpEntity) {
      throw new HttpException('Invalid OTP', 400);
    }

    if (otpEntity.user.id !== user.id) {
      throw new HttpException('Invalid OTP', 400);
    }

    if (isPast(otpEntity.expiryAt)) {
      this.deleteOtp(otpEntity);
      throw new HttpException('OTP Expired. Please regenerate', 400);
    }

    return otpEntity;
  }

  async deleteOtp(otp: OTP): Promise<boolean> {
    await this.otpRepository.delete(otp.id);
    return true;
  }
}
