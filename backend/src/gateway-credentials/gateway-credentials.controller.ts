import { Body, Controller, Get, Post, Request } from '@nestjs/common';
import { GatewayCredentialsService } from './gateway-credentials.service';
import { CredentialUpdate } from './dto/credential-update.input';

@Controller('gateway-credentials')
export class GatewayCredentialsController {
  constructor(
    private readonly gatewayCredentialsService: GatewayCredentialsService,
  ) {}

  @Post()
  async upsert(
    @Request() req,
    @Body() updateDto: CredentialUpdate,
  ) {
    return await this.gatewayCredentialsService.upsert({
      userId: req.currentUser.id,
      ...updateDto,
    });
  }

  @Get()
  async get(@Request() req) {
    return await this.gatewayCredentialsService.findOneByUserId({
      userId: req.currentUser.id,
    });
  }
}
