import { Module } from '@nestjs/common';
import { ChallengeGateway } from 'src/challenge.gateway';
import { ChallengeService } from 'src/challengeService';
import { GameGateway } from 'src/game.gateway';

@Module({
    providers: [ChallengeService, GameGateway, ChallengeGateway],
})
export class GameModule {}
