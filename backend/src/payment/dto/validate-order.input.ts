import { IsNotEmpty, IsNumber, IsString, Max, Min } from 'class-validator';
import { CastToPositiveNumber } from 'src/environment/decorators/cast-to-positive-number';

export class ValidateOrderInput {
  @IsString()
  @IsNotEmpty()
  api_key: string;

  @CastToPositiveNumber()
  @IsNumber()
  @Min(1)
  @Max(5000)
  amount: number;

  @IsString()
  @IsNotEmpty()
  order_id: string;
}
