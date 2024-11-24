import { IsNotEmpty, IsString } from 'class-validator';

export class CheckPayment {
  @IsString()
  @IsNotEmpty()
  order_id: string;

  @IsString()
  @IsNotEmpty()
  api_key: string;
}
