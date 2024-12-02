import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from './order.entity';
import { Repository } from 'typeorm';
import { EnvironmentService } from 'src/environment/environment.service';
import { GatewayCredentialsService } from 'src/gateway-credentials/gateway-credentials.service';
import { GATEWAYS } from 'src/gateway-credentials/constants';
import { createHash } from 'crypto';

@Injectable()
export class PhonepeService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly environmentService: EnvironmentService,
    private readonly gatewayCredentialsService: GatewayCredentialsService,
  ) {}

  async generateQRCode(order: Order) {
    const orderId = order.orderId;
    const amount = order.amount;

    // Check for user on order.
    if (!order.user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    if (order.qrString) {
      return order.qrString;
    }

    const credentials = await this.gatewayCredentialsService.findOneByUserId({
      userId: order.user.id,
    });

    if (!credentials) {
      throw new HttpException(
        'Phonepe credentials not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const phonepeCredential =
      await this.gatewayCredentialsService.getGatewayCredentials({
        userId: order.user.id,
        gateway: GATEWAYS.PHONEPE.id,
      });

    if (
      !phonepeCredential ||
      !phonepeCredential.key ||
      !phonepeCredential.secret
    ) {
      throw new HttpException(
        'Phonepe credentials not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const payloadData = {
      merchantId: phonepeCredential.key,
      transactionId: orderId,
      amount: amount * 100, // Phonepe expects amount in paise
      expiresIn: 5 * 60, // 5 minutes
      merchantOrderId: orderId,
    };

    const payload = JSON.stringify(payloadData);
    const payloadBase64 = Buffer.from(payload).toString('base64');
    const keyIndex = 1;
    const string = payloadBase64 + '/v3/qr/init' + phonepeCredential.secret;
    const sha256 = createHash('sha256').update(string).digest('hex');
    const checkSum = sha256 + '###' + keyIndex;

    const url = 'https://mercury-t2.phonepe.com/v3/qr/init';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-VERIFY': checkSum,
        'X-CALL-MODE': 'POST',
      },
      body: JSON.stringify({
        request: payloadBase64,
      }),
    });

    if (!response.ok) {
      try {
        const errorText = await response.text();
        const errorObj = JSON.parse(errorText);

        if (errorObj && errorObj.message) {
          throw new HttpException(
            'PhonePe API: ' + errorObj.message,
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
      } catch (err) {
        throw new HttpException(
          'Invalid PhonePe API response',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      throw new HttpException(
        'Failed to generate QR Code',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const json = await response.json();

    if (!json.success) {
      throw new HttpException(
        'PhonePe API failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    if (!json.data || !json.data.qrString) {
      throw new HttpException(
        'Invalid PhonePe QR Code response',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const qrString = json.data.qrString;

    this.orderRepository.update(order.id, {
      qrString,
    });

    return qrString;
  }
}
