import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ChallengeService } from './challengeService';
import { Challenge } from './types';

@Controller('challenge')
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly challengeService: ChallengeService,
  ) { }

  @Get('')
  getHello(): string {
    return '>' + this.appService.getHello();
  }

  @Get('test')
  getTest(): string {
    return 'Test!';
  }

  @Get('list')
  challenges(): Omit<Challenge, 'deck'>[] {
    return this.challengeService.getPublicChallenges()
  }

}
