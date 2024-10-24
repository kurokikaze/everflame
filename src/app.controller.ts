import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { ChallengeService } from './challengeService';

@Controller('challenge')
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly challengeService: ChallengeService
  ) {}

  @Get('')
  getHello(): string {
    return '>' + this.appService.getHello();
  }

  @Get('test')
  getTest(): string {
    return 'Test!';
  }

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
