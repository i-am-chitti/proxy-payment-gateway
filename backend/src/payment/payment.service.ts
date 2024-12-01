import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import Razorpay from 'razorpay';
import { EnvironmentService } from 'src/environment/environment.service';
import { CreateOrderInput } from 'src/payment/dto/create-order.input';
import { Order, OrderStatus } from 'src/payment/order.entity';
import { User } from 'src/users/user.entity';
import { Repository } from 'typeorm';
import * as path from 'path';
import * as fs from 'fs';
import { downloadFile } from 'src/payment/utils';
import { addMinutes, getUnixTime } from 'date-fns';
import { GatewayCredentialsService } from 'src/gateway-credentials/gateway-credentials.service';
import { GATEWAYS } from 'src/gateway-credentials/constants';
import { RazorpayService } from './razorpay.service';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @Inject('RAZORPAY') private readonly razorpay: Razorpay,
    private readonly environmentService: EnvironmentService,
    private readonly gatewayCredentialsService: GatewayCredentialsService,
    private readonly razorpayService: RazorpayService,
  ) {}

  async createOrder(order: CreateOrderInput) {
    const apiKey = order.api_key;

    const user = await this.userRepository.findOne({
      where: { apiKey },
    });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const existingOrder = await this.orderRepository.findOne({
      where: { orderId: order.order_id },
      relations: ['user'],
    });

    if (existingOrder) {
      return existingOrder;
    }

    const gateway = await this.getUPIGateway(user);

    const orderObj = {
      amount: order.amount,
      orderId: order.order_id,
      redirectUrl: order.redirect_url,
      user: user,
      gateway,
    };

    const newOrder = this.orderRepository.create(orderObj);
    const newOrderOnSave = await this.orderRepository.save(newOrder);
    delete newOrderOnSave.user;
    return newOrderOnSave;
  }

  async validateOrder(order: { orderId: string; apiKey: string }) {
    const apiKey = order.apiKey;

    const user = await this.userRepository.findOne({
      where: { apiKey },
    });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const existingOrder = await this.orderRepository.findOne({
      where: { orderId: order.orderId },
    });

    if (!existingOrder) {
      return false;
    }
    return true;
  }

  async generateUPIQRCode(order: Order) {
    const qrData = {};
    switch (order.gateway) {
      case GATEWAYS.RAZORPAY.id: {
        qrData['imageUrl'] = await this.razorpayService.generateQRCode(order);
        break;
      }
    }

    return qrData;
  }

  async generateQRCode(order: Order) {
    const qrCodeDirPath = path.join(__dirname, '../..', 'public/qrcode');

    // Make sure the public directory exists
    if (!fs.existsSync(qrCodeDirPath)) {
      fs.mkdirSync(qrCodeDirPath, { recursive: true });
    }

    const fileName = `${order.orderId}.jpeg`;
    const filePath = path.join(qrCodeDirPath, fileName);

    if (order.qrCodeId) {
      const qrCode = await this.razorpay.qrCode.fetch(order.qrCodeId);
      if (qrCode && qrCode.status === 'active') {
        // Valid QR Code.
        return `/qrcode/${fileName}`;
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
    const qrCode = await this.razorpay.qrCode.create({
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

    return `/qrcode/${fileName}`;
  }

  async checkPayment(details: { order_id: string }) {
    const order = await this.orderRepository.findOne({
      where: { orderId: details.order_id },
    });

    if (!order) {
      throw new HttpException('Order not found', HttpStatus.NOT_FOUND);
    }

    if (order.status === OrderStatus.SUCCESS) {
      return {
        data: {
          success: true,
        },
        message: ['Payment successful'],
      };
    }

    const qrCodeId = order.qrCodeId;

    if (!qrCodeId) {
      throw new HttpException('QR Code not found', HttpStatus.NOT_FOUND);
    }

    const payments = await this.razorpay.qrCode.fetchAllPayments(qrCodeId);

    if (payments.count === 0) {
      return {
        data: {
          success: false,
        },
        message: ['Payment failed'],
      };
    }

    // Payment done. Close QR code.
    await this.razorpay.qrCode.close(qrCodeId);

    return {
      data: {
        success: true,
        txn_id: payments.items[0].id,
      },
      message: ['Payment successful'],
    };
  }

  async getUPIGateway(user: User) {
    const gatewayCredentials =
      await this.gatewayCredentialsService.findOneByUserId({
        userId: user.id,
      });

    if (!gatewayCredentials) {
      throw new HttpException(
        'Gateway credentials not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const gateways = Object.keys(GATEWAYS);
    const enabledGateways = gateways.filter((gateway) => {
      return gatewayCredentials[GATEWAYS[gateway].credentials.enabled];
    });

    if (!enabledGateways.length) {
      throw new HttpException(
        'No payment gateway enabled',
        HttpStatus.NOT_FOUND,
      );
    }

    // Return random gateway
    const randomGateway =
      enabledGateways[Math.floor(Math.random() * enabledGateways.length)];

    return randomGateway;
  }
}
