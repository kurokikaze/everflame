import { Injectable } from '@nestjs/common';

@Injectable()
export class ChallengeService {
  private challenges: Challenge[] = []

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
