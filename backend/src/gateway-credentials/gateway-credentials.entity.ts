import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { secretTransformer } from './gateway-credentials.util';
import { User } from 'src/users/user.entity';

@Entity('gateway-credentials')
export class GatewayCredentials {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User)
  @JoinColumn()
  user: User;

  @Column({
    default: false,
  })
  isRazorpayEnabled: boolean;

  @Column({
    nullable: true,
  })
  razorpayKeyId: string;

  @Column({
    nullable: true,
    transformer: secretTransformer,
  })
  razorpayKeySecret: string;

  @Column({
    default: false,
  })
  isPhonepeEnabled: boolean;

  @Column({
    nullable: true,
  })
  phonepeMerchantId: string;

  @Column({
    nullable: true,
    transformer: secretTransformer,
  })
  phonepeMerchantSecret: string;

  @Column({
    default: false,
  })
  isStripeEnabled: boolean;

  @Column({
    nullable: true,
  })
  stripePublishableKey: string;

  @Column({
    nullable: true,
    transformer: secretTransformer,
  })
  stripeSecretKey: string;
}
