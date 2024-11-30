import { Module } from '@nestjs/common';
import { GatewayCredentialsController } from './gateway-credentials.controller';
import { GatewayCredentialsService } from './gateway-credentials.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GatewayCredentials } from './gateway-credentials.entity';

@Module({
  imports: [TypeOrmModule.forFeature([GatewayCredentials])],
  controllers: [GatewayCredentialsController],
  providers: [GatewayCredentialsService],
})
export class GatewayCredentialsModule {}
