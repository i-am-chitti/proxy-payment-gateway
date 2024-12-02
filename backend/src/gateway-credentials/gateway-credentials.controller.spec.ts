import { Test, TestingModule } from '@nestjs/testing';
import { GatewayCredentialsController } from './gateway-credentials.controller';

describe('GatewayCredentialsController', () => {
  let controller: GatewayCredentialsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GatewayCredentialsController],
    }).compile();

    controller = module.get<GatewayCredentialsController>(GatewayCredentialsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
