import { Module } from '@nestjs/common';
import { GatewayCredentialsController } from './gateway-credentials.controller';
import { GatewayCredentialsService } from './gateway-credentials.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [GatewayCredentialsController],
  providers: [GatewayCredentialsService],
})
export class GatewayCredentialsModule {}
