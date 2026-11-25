import { Module } from '@nestjs/common';
import { ChallengeGateway } from '../challenge.gateway.js';
import { ChallengeService } from '../challengeService.js';
import { GameGateway } from './game.gateway';
import { GameService } from './gameService';

@Module({
    providers: [ChallengeService, GameService, GameGateway, ChallengeGateway],
    exports: [ChallengeService, GameService],
})
export class GameModule {}
