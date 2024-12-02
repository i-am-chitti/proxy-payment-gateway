import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/user.entity';
import { Order } from 'src/payment/order.entity';
import { RazorpayService } from './razorpay.service';
import { GatewayCredentialsModule } from 'src/gateway-credentials/gateway-credentials.module';
import { PhonepeService } from './phonepe.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Order]), GatewayCredentialsModule],
  providers: [PaymentService, RazorpayService, PhonepeService],
  controllers: [PaymentController],
})
export class PaymentModule {}
