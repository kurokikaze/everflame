import { Body, Controller, Get, Post } from '@nestjs/common';
import { ChallengeService } from './challengeService';

@Controller('challenges')
export class ChallengeController {
  constructor(
    private readonly challengeService: ChallengeService
  ) {}

  @Get('list')
  challenges(): Challenge[] {
    return this.challengeService.getChallenges()
  }

  @Post('register')
  register(@Body('userId') userId: number, @Body('comment') comment: string): Challenge[] {
    const challenge: Challenge = {
      userId,
      comment,
      dateCreated: new Date(),
    }
    this.challengeService.register(challenge)
    return this.challengeService.getChallenges()
  }

  @Post('unregister')
  unregister(@Body('userId') userId: number) {
    this.challengeService.unregister(userId)
  }
}
