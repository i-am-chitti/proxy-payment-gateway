import { IsOptional, IsString } from 'class-validator';

export class CredentialUpdate {
  @IsString()
  @IsOptional()
  razorpay_key_id: string;

  @IsString()
  @IsOptional()
  razorpay_key_secret: string;

  @IsString()
  @IsOptional()
  phonepe_merchant_id: string;

  @IsString()
  @IsOptional()
  phonepe_merchant_secret: string;

  @IsString()
  @IsOptional()
  stripe_publishable_key: string;

  @IsString()
  @IsOptional()
  stripe_secret_key: string;
}
