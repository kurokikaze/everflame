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
  challenges(): Challenge[] {
    return this.challengeService.getChallenges()
  }
}
