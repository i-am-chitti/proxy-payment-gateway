import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateOrderInput } from 'src/payment/dto/create-order.input';
import { Order, OrderStatus } from 'src/payment/order.entity';
import { User } from 'src/users/user.entity';
import { Repository } from 'typeorm';
import { GatewayCredentialsService } from 'src/gateway-credentials/gateway-credentials.service';
import { GATEWAYS } from 'src/gateway-credentials/constants';
import { RazorpayService } from './razorpay.service';
import { PhonepeService } from './phonepe.service';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly gatewayCredentialsService: GatewayCredentialsService,
    private readonly razorpayService: RazorpayService,
    private readonly phonepeService: PhonepeService,
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
      case GATEWAYS.PHONEPE.id: {
        qrData['qrString'] = await this.phonepeService.generateQRCode(order);
      }
    }

    return qrData;
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

    switch (order.gateway) {
      case GATEWAYS.RAZORPAY.id: {
        return this.razorpayService.checkPayment(order);
      }
    }
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
