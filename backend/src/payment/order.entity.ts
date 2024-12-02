import { User } from 'src/users/user.entity';
import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum OrderStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
}

@Entity('order')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: number;

  @Column({
    type: 'int',
  })
  amount: number;

  @Column()
  orderId: string;

  @Column()
  redirectUrl: string;

  @Column({
    default: OrderStatus.PENDING,
  })
  @Check(
    `"status" IN (${Object.values(OrderStatus)
      .map((status) => `'${status}'`)
      .join(', ')})`,
  )
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn()
  user: User;

  @Column({
    nullable: true,
  })
  qrCodeId: string;

  @Column({
    nullable: true,
  })
  qrString: string;

  @Column()
  gateway: string;
}
