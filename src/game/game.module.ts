import { Module } from '@nestjs/common';
import { GameGateway } from 'src/game.gateway';

@Module({
    providers: [GameGateway],
})
export class GameModule {}
