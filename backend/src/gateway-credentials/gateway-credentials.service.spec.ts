import { Test, TestingModule } from '@nestjs/testing';
import { GatewayCredentialsService } from './gateway-credentials.service';

describe('GatewayCredentialsService', () => {
  let service: GatewayCredentialsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GatewayCredentialsService],
    }).compile();

    service = module.get<GatewayCredentialsService>(GatewayCredentialsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
