import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { ChallengeService } from './challengeService';
import { Challenge } from './types';
import { AuthService } from './auth/auth.service';
import { v4 } from 'uuid';

@Controller('challenge')
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly challengeService: ChallengeService,
    private readonly authService: AuthService
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
  challenges(): Challenge[] {
    return this.challengeService.getChallenges()
  }

  @Get('testRegister')
  testRegister() {
    this.authService.signUp({
      email: 'test1@example.com',
      name: 'testUser',
      password1: 'testPass',
      password2: 'testPass'
    })
    return { success: true }
  }

  @Post('register')
  register(@Body('userId') userId: number, @Body('comment') comment: string, @Body('deck') deck: string[]): Challenge[] {
    const challenge: Challenge = {
      userId,
      comment,
      dateCreated: new Date(),
      id: v4(),
      deck,
    }
    this.challengeService.register(challenge)
    return this.challengeService.getChallenges()
  }

  @Post('unregister')
  unregister(@Body('userId') userId: number) {
    this.challengeService.unregister(userId)
  }
}
