import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module';
import { EnvironmentModule } from 'src/environment/environment.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EnvironmentService } from 'src/environment/environment.service';
import { AuthModule } from 'src/auth/auth.module';
import { OtpModule } from 'src/otp/otp.module';
import { PaymentModule } from './payment/payment.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),
    EnvironmentModule.forRoot({}),
    DatabaseModule,
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (environmentService: EnvironmentService) => ({
        transport: {
          host: environmentService.get('MAILER_HOST'),
          port: environmentService.get('MAILER_PORT'),
          secure: false,
          auth: {
            user: environmentService.get('MAILER_USER'),
            pass: environmentService.get('MAILER_PASS'),
          },
        },
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    OtpModule,
    UsersModule,
    PaymentModule,
  ],
  controllers: [AppController],
  providers: [AppService, EnvironmentService],
})
export class AppModule {}
