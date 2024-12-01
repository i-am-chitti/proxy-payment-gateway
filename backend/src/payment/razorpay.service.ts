import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Razorpay from 'razorpay';
import { validatePaymentVerification } from 'razorpay/dist/utils/razorpay-utils';
import { EnvironmentService } from 'src/environment/environment.service';
import { RazorpayCallbackInput } from 'src/payment/dto/razorpay-callback.input';
import { Order, OrderStatus } from 'src/payment/order.entity';
import { User } from 'src/users/user.entity';
import { Repository } from 'typeorm';
import * as path from 'path';
import * as fs from 'fs';
import { downloadFile } from 'src/payment/utils';
import { addMinutes, getUnixTime } from 'date-fns';
import { GatewayCredentialsService } from 'src/gateway-credentials/gateway-credentials.service';
import { GATEWAYS } from 'src/gateway-credentials/constants';

@Injectable()
export class RazorpayService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly environmentService: EnvironmentService,
    private readonly gatewayCredentialsService: GatewayCredentialsService,
  ) {}

  async getRazorpayInstance(user: User): Promise<Razorpay> {
    const credentials = await this.gatewayCredentialsService.findOneByUserId({
      userId: user.id,
    });

    if (!credentials) {
      throw new HttpException(
        'Razorpay credentials not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const razorpayCredential =
      await this.gatewayCredentialsService.getGatewayCredentials({
        userId: user.id,
        gateway: GATEWAYS.RAZORPAY.id,
      });

    if (
      !razorpayCredential ||
      !razorpayCredential.key ||
      !razorpayCredential.secret
    ) {
      throw new HttpException(
        'Razorpay credentials not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return new Razorpay({
      key_id: razorpayCredential.key,
      key_secret: razorpayCredential.secret,
    });
  }

  async generateQRCode(order: Order) {
    const razorpay = await this.getRazorpayInstance(order.user);

    const qrCodeDirPath = path.join(
      __dirname,
      '../..',
      'public/razorpay/qrcode',
    );

    // Make sure the public directory exists
    if (!fs.existsSync(qrCodeDirPath)) {
      fs.mkdirSync(qrCodeDirPath, { recursive: true });
    }

    const fileName = `${order.orderId}.jpeg`;
    const filePath = path.join(qrCodeDirPath, fileName);

    if (order.qrCodeId) {
      const qrCode = await razorpay.qrCode.fetch(order.qrCodeId);
      if (qrCode && qrCode.status === 'active') {
        // Valid QR Code.
        return `/razorpay/qrcode/${fileName}`;
      } else {
        if (fs.existsSync(filePath)) {
          console.log(
            'QR Code is not active. Deleting previous Regenerating...',
          );
          fs.unlinkSync(filePath);
        }
      }
    }

    // Create a new QR Code.
    const qrCode = await razorpay.qrCode.create({
      type: 'upi_qr',
      usage: 'single_use',
      name: order.orderId,
      fixed_amount: true,
      payment_amount: order.amount * 100, // accepts in paisa
      description: 'Membership Fee',
      close_by: getUnixTime(addMinutes(new Date(), 5)),
    });

    const imageUrl = qrCode?.image_url;

    if (!imageUrl) {
      throw new HttpException(
        'QR Code not generated',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    this.orderRepository.update(order.id, {
      qrCodeId: qrCode.id,
    });

    // Async call
    await downloadFile(imageUrl, filePath);

    return `/razorpay/qrcode/${fileName}`;
  }

  /**
   * Pending
   */
  async callbackHandler(razorpayCallback: RazorpayCallbackInput) {
    const {
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
    } = razorpayCallback;
    const order = await this.orderRepository.findOne({
      where: { orderId },
    });

    if (!order) {
      throw new HttpException('Order not found', HttpStatus.NOT_FOUND);
    }

    const razorpay = await this.getRazorpayInstance(order.user);

    const secret = this.environmentService.get('RAZORPAY_KEY_SECRET');
    const isValid = validatePaymentVerification(
      {
        order_id: orderId,
        payment_id: paymentId,
      },
      signature,
      secret,
    );

    if (!isValid) {
      throw new HttpException('Invalid signature', HttpStatus.UNAUTHORIZED);
    }

    // get payment detail.
    console.log(await razorpay.payments.fetch(paymentId));
    /**
     * LEFT Here
     * Fetch payment details, then save it in transaction table.
     */
    // order.paymentId = payment_id;
    order.status = OrderStatus.SUCCESS;
    await this.orderRepository.save(order);
    return true;
  }

  async checkPayment(order: Order) {
    const qrCodeId = order.qrCodeId;

    if (!qrCodeId) {
      throw new HttpException('QR Code not found', HttpStatus.NOT_FOUND);
    }

    const razorpay = await this.getRazorpayInstance(order.user);

    const payments = await razorpay.qrCode.fetchAllPayments(qrCodeId);

    if (payments.count === 0) {
      return {
        data: {
          success: false,
        },
        message: ['Payment failed'],
      };
    }

    // Payment done. Close QR code.
    await razorpay.qrCode.close(qrCodeId);

    return {
      data: {
        success: true,
        txn_id: payments.items[0].id,
      },
      message: ['Payment successful'],
    };
  }
}
