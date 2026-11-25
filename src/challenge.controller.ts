import { Body, Controller, Get, Post } from '@nestjs/common';
import { ChallengeService } from './challengeService';
import { Challenge } from './types';
import { v4 } from 'uuid';

@Controller('challenges')
export class ChallengeController {
  constructor(
    private readonly challengeService: ChallengeService
  ) { }

  @Get('list')
  challenges(): Omit<Challenge, 'deck'>[] {
    return this.challengeService.getPublicChallenges()
  }
}
