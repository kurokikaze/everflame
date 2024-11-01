import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { AppController } from './app.controller';
import { ChallengeController } from './challenge.controller';
import { AppService } from './app.service';
import { ChallengeService } from './challengeService';
import { GameModule } from './game/game.module';
import { ConfigModule } from '@nestjs/config';
import { validationSchema } from './config/config.schema';
import { config } from './config';
import { MikroOrmConfig } from './config/micro-orm.config';
import { CommonModule } from './common/common.module';
import { UsersModule } from './users/users.module';
import { JwtModule } from './jwt/jwt.module';
import { MailerModule } from './mailer/mailer.module';
import { AuthModule } from './auth/auth.module';
import { BlacklistedTokenEntity } from './auth/entity/blacklisted-token.entity';
import { UserController } from './user/user.controller';
// import { APP_GUARD } from '@nestjs/core';
// import { AuthGuard } from './auth/guards/auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
      load: [config],
    }),
    MikroOrmModule.forRootAsync({
      imports: [ConfigModule],
      useClass: MikroOrmConfig,
    }),
    MikroOrmModule.forFeature([BlacklistedTokenEntity]),
    GameModule,
    CommonModule,
    UsersModule,
    JwtModule,
    MailerModule,
    AuthModule
  ],
  controllers: [AppController, ChallengeController, UserController],
  providers: [
    // {
    //   provide: APP_GUARD,
    //   useClass: AuthGuard,
    // },
    AppService,
    ChallengeService
  ],
})

export class AppModule { }
