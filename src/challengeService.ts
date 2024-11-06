import { Injectable } from '@nestjs/common';
import { Challenge } from './types';
import { v4 } from 'uuid';
import { GameService } from './game/gameService';

const testChallenge: Challenge = {
  comment: 'Evu challenges you',
  dateCreated: new Date(),
  deck: ['Eebit'],
  userId: '12',
  id: v4()
}

type ChallengeCallback = (event: string, dto: any) => void

@Injectable()
export class ChallengeService {
  constructor(
    private gameService: GameService
  ) { }

  private challenges: Challenge[] = [
    testChallenge
  ]

  private challengeClients: Record<string, any> = {}

  private callbacks: Record<string, ChallengeCallback> = {}

  register(challenge: Challenge, client: any) {
    console.log('inside service')
    console.dir(challenge)
    this.challenges.push(challenge)
    this.challengeClients[challenge.id] = client

    this.sendOut('register', challenge)
    return this.challenges;
  }

  unregister(userId: string) {
    this.challenges = this.challenges.filter(({ userId: id }) => id !== userId)
    this.sendOut('unregister', userId)
  }

  accept(challengeId: string, playerId: string, deck: string[]): string | null {
    if (!(challengeId in this.challenges)) return null
    const challenge: Challenge = this.challenges[challengeId]
    if (challenge.userId === playerId) return null

    const [secretOne, secretTwo] = this.gameService.create(
      challenge.userId.toString(),
      playerId,
      challenge.deck,
      deck
    )

    this.sendOut('accept', {
      userId: challenge.userId,
      challengeId,
      secret: secretOne,
    })

    return secretTwo
  }

  hasChallenge(clientId: string): boolean {
    return this.challenges.some(challenge => challenge.userId == clientId)
  }

  getChallengingClient(challengeId: string): string | null {
    if (challengeId in this.challengeClients) return this.challengeClients[challengeId]

    return null
  }

  getChallenges() {
    return this.challenges;
  }

  onChange(callback: ChallengeCallback) {
    const callbackId = v4()

    this.callbacks[callbackId] = callback

    return () => { delete this.callbacks[callbackId] }
  }

  sendOut(type: string, argument: any) {
    Object.values(this.callbacks).forEach(callback => callback(type, argument))
  }
}
