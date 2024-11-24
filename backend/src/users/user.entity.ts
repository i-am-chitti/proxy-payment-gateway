import { Exclude, instanceToPlain } from 'class-transformer';
import { Order } from 'src/payment/order.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  email: string;

  @Column()
  phoneNumber: string;

  @Column()
  name: string;

  @Column()
  @Exclude({ toPlainOnly: true })
  password: string;

  @Column({ nullable: true })
  avatarUrl: string;

  @Column({ nullable: false, default: false })
  emailVerified: boolean;

  @Column({ nullable: false, default: false })
  phoneNumberVerified: boolean;

  @Column({ nullable: false, default: false })
  disabled: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  deletedAt: Date;

  @Column({ nullable: true })
  passwordRestToken: string;

  @Column({ nullable: true })
  passwordResetTokenExpiresAt: Date;

  @Column({ nullable: true })
  apiKey: string;

  @Column({ nullable: true })
  lastGeneratedApiKeyAt: Date;

  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];

  toJSON() {
    return instanceToPlain(this);
  }
}
