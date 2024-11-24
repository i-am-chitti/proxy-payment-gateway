import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Request,
} from '@nestjs/common';
import { UsersService } from 'src/users/users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('api-key')
  async generateApiKey(@Request() req) {
    const user = await this.usersService.findOneByEmail(req.user.email);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    const apiKey = await this.usersService.generateApiKey(user);
    return {
      data: {
        apiKey,
      },
    };
  }

  @Get('api-key')
  async getApiKey(@Request() req) {
    const user = await this.usersService.findOneByEmail(req.user.email);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }
    return {
      data: {
        apiKey: await this.usersService.getApiKey(user),
      },
    };
  }
}
