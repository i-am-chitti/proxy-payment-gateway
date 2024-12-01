import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { CastToBoolean } from 'src/environment/decorators/cast-to-boolean.decorator';

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

  @IsBoolean()
  @CastToBoolean()
  @IsOptional()
  is_razorpay_enabled: boolean;

  @IsBoolean()
  @CastToBoolean()
  @IsOptional()
  is_phonepe_enabled: boolean;

  @IsBoolean()
  @CastToBoolean()
  @IsOptional()
  is_stripe_enabled: boolean;
}
