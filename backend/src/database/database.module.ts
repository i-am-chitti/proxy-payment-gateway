import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GatewayCredentials } from 'src/gateway-credentials/gateway-credentials.entity';
import { OTP } from 'src/otp/otp.entity';
import { Order } from 'src/payment/order.entity';
import { User } from 'src/users/user.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'sqlite.db',
      synchronize: true,
      entities: [User, OTP, Order, GatewayCredentials],
    }),
  ],
})
export class DatabaseModule {}
