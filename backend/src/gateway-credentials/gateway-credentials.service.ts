import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { GatewayCredentials } from './gateway-credentials.entity';
import { Repository } from 'typeorm';
import { CredentialUpdate } from './dto/credential-update.input';

@Injectable()
export class GatewayCredentialsService {
  constructor(
    @InjectRepository(GatewayCredentials)
    private readonly gatewayCredentialsRepository: Repository<GatewayCredentials>,
  ) {}

  async findOneByUserId({ userId }: { userId: string }) {
    return this.gatewayCredentialsRepository.findOne({
      where: {
        user: { id: userId },
      },
    });
  }

  async createGatewayCredentials({ userId }: { userId: string }) {
    const existingGatewayCredentials = await this.findOneByUserId({ userId });

    if (existingGatewayCredentials) {
      return {
        message: 'Gateway credentials already exist',
      };
    }

    await this.gatewayCredentialsRepository.save({
      user: { id: userId },
    });

    return {
      message: 'Gateway credentials created successfully',
    };
  }

  async upsert(updateDto: { userId: string } & Partial<CredentialUpdate>) {
    await this.gatewayCredentialsRepository.upsert(
      {
        user: { id: updateDto.userId },
        razorpayKeyId: updateDto?.razorpay_key_id ?? null,
        razorpayKeySecret: updateDto?.razorpay_key_secret ?? null,
        phonepeMerchantId: updateDto?.phonepe_merchant_id ?? null,
        phonepeMerchantSecret: updateDto?.phonepe_merchant_secret ?? null,
        stripePublishableKey: updateDto?.stripe_publishable_key ?? null,
        stripeSecretKey: updateDto?.stripe_secret_key ?? null,
      },
      ['user'], // The conflict path; ensure 'user' is unique or a primary key in the table
    );

    return {
      message: 'Gateway credentials updated or inserted successfully',
    };
  }
}
