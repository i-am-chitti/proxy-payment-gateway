import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/user.entity';
import { Order } from 'src/payment/order.entity';
import { ConfigService } from '@nestjs/config';
import { EnvironmentService } from 'src/environment/environment.service';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Razorpay = require('razorpay');

@Module({
  imports: [TypeOrmModule.forFeature([User, Order])],
  providers: [
    PaymentService,
    {
      provide: 'RAZORPAY',
      inject: [ConfigService],
      useFactory: (environmentService: EnvironmentService) => {
        return new Razorpay({
          key_id: environmentService.get('RAZORPAY_KEY_ID'),
          key_secret: environmentService.get('RAZORPAY_KEY_SECRET'),
        });
      },
    },
  ],
  controllers: [PaymentController],
})
export class PaymentModule {}
