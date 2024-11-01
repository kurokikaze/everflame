import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { JwtModule } from '../jwt/jwt.module';
import { MailerModule } from '../mailer/mailer.module';
import { UsersModule } from '../users/users.module';
import { BlacklistedTokenEntity } from './entity/blacklisted-token.entity';
import { CommonService } from 'src/common/common.service';
import { AuthController } from './auth.controller';

@Module({
  imports: [
    MikroOrmModule.forFeature([BlacklistedTokenEntity]),
    UsersModule,
    JwtModule,
    MailerModule,
  ],
  providers: [AuthService, CommonService],
  exports: [AuthService],
  controllers: [AuthController]
})

export class AuthModule { }
