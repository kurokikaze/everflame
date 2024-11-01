import { Injectable } from '@nestjs/common';
import { Challenge } from './types';
import { v4 } from 'uuid';

const testChallenge: Challenge = {
  comment: 'Evu',
  dateCreated: new Date(),
  deck: ['Eebit'],
  userId: 1,
  id: v4()
}

@Injectable()
export class ChallengeService {
  private challenges: Challenge[] = [
    testChallenge
  ]

  register(challenge: Challenge) {
    this.challenges.push(challenge)

    return this.challenges;
  }

  unregister(userId: number) {
    this.challenges = this.challenges.filter(({ userId: id }) => id !== userId)
  }

  getChallenges() {
    return this.challenges;
  }
}
