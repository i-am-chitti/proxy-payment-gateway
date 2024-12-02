import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  validateSync,
} from 'class-validator';
import { CastToBoolean } from './decorators/cast-to-boolean.decorator';
import { plainToClass } from 'class-transformer';
import { assert } from 'src/utils/assert';
import { CastToPositiveNumber } from './decorators/cast-to-positive-number';

export class EnvironmentVariables {
  @CastToBoolean()
  @IsOptional()
  @IsBoolean()
  DEBUG_MODE: boolean = false;

  @IsString()
  MAILER_HOST: string = 'localhost';

  @CastToPositiveNumber()
  @IsNumber()
  @Min(1)
  @Max(65535)
  MAILER_PORT: number = 587;

  @IsString()
  MAILER_USER: string = 'sender@airoulettle.com';

  @IsString()
  MAILER_PASS: string = 'password';

  @CastToPositiveNumber()
  @IsNumber()
  @Min(5)
  @Max(30)
  OTP_VALIDITY_MINUTES: number = 5;

  @IsString()
  RAZORPAY_KEY_ID: string = '';
  RAZORPAY_KEY_SECRET: string = '';

  @IsString()
  JWT_SECRET: string = '';

  @IsString()
  CREDENTIAL_SECRET_KEY: string = '';
}

export const validate = (config: Record<string, unknown>) => {
  const validatedConfig = plainToClass(EnvironmentVariables, config);

  const errors = validateSync(validatedConfig);

  assert(!errors.length, errors.toString());

  return validatedConfig;
};
