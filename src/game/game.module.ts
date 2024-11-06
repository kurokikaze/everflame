import { Module } from '@nestjs/common';
import { ChallengeGateway } from 'src/challenge.gateway';
import { ChallengeService } from 'src/challengeService';
import { GameGateway } from './game.gateway';
import { GameService } from './gameService';

@Module({
    providers: [ChallengeService, GameService, GameGateway, ChallengeGateway],
})
export class GameModule {}
