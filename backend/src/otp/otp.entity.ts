import { User } from 'src/users/user.entity';
import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum OTPActions {
  REGISTER = 'REGISTER',
  FORGOT_PASSWORD = 'FORGOT_PASSWORD',
  CHANGE_PHONE_NUMBER = 'CHANGE_PHONE_NUMBER',
  LOGIN = 'LOGIN',
  VERIFY_EMAIL = 'VERIFY_EMAIL',
  VERIFY_MOBILE = 'VERIFY_MOBILE',
}

@Entity()
export class OTP {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  otp: string;

  @Column()
  @Check(
    `"action" IN (${Object.values(OTPActions)
      .map((otp) => `'${otp}'`)
      .join(', ')})`,
  )
  action: string;

  @OneToOne(() => User)
  @JoinColumn()
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @Column()
  expiryAt: Date;
}
