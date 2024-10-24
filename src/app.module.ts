import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ChallengeController } from './challenge.controller';
import { AppService } from './app.service';
import { ChallengeService } from './challengeService';
import { GameModule } from './game/game.module';

@Module({
  imports: [GameModule],
  controllers: [AppController, ChallengeController],
  providers: [AppService, ChallengeService],
})
export class AppModule {}
