import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import { Public } from 'src/auth/auth.guard';
import { CheckPayment } from 'src/payment/dto/check-payment';
import { CreateOrderInput } from 'src/payment/dto/create-order.input';
import { RazorpayCallbackInput } from 'src/payment/dto/razorpay-callback.input';
import { ValidateOrderInput } from 'src/payment/dto/validate-order.input';
import { PaymentService } from 'src/payment/payment.service';
import { RazorpayService } from './razorpay.service';

@Controller('payment')
export class PaymentController {
  constructor(
    private paymentService: PaymentService,
    private readonly razorpayService: RazorpayService,
  ) {}

  @Public()
  @Post('order/validate')
  async validateOrder(@Body() paymentDto: ValidateOrderInput) {
    const isValid = await this.paymentService.validateOrder({
      orderId: paymentDto.order_id,
      apiKey: paymentDto.api_key,
    });

    return {
      data: {
        success: isValid,
      },
      message: isValid ? ['Order is valid'] : ['Order is invalid'],
    };
  }

  @Public()
  @Post('order')
  async createOrder(@Body() orderDto: CreateOrderInput) {
    const order = await this.paymentService.createOrder(orderDto);
    return {
      data: order,
      message: ['Order created successfully'],
    };
  }

  @Public()
  @Post('upi')
  async generateUPIQRCode(@Body() orderDto: CreateOrderInput) {
    const order = await this.paymentService.createOrder(orderDto);
    const qrData = await this.paymentService.generateUPIQRCode(order);

    return {
      data: qrData,
      message: ['QR Code generated successfully'],
    };
  }

  @Public()
  @Post('razorpay/handler')
  async razorpayCallback(@Body() razorpayCallbackInput: RazorpayCallbackInput) {
    return this.razorpayService.callbackHandler(razorpayCallbackInput);
  }

  @Public()
  @Get('check')
  async checkPayment(@Query() query: CheckPayment) {
    const isValid = this.paymentService.validateOrder({
      orderId: query.order_id,
      apiKey: query.api_key,
    });
    if (!isValid) {
      throw new HttpException('Order not found', HttpStatus.NOT_FOUND);
    }

    return this.paymentService.checkPayment(query);
  }
}
