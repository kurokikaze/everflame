import { Injectable } from '@nestjs/common';
import { Challenge } from './types';
import { v4 } from 'uuid';
import { GameService } from './game/gameService';

type ChallengeCallback = (event: string, dto: any) => void

export const CHALLENGE_EVENT_REGISTER = 'register'
export const CHALLENGE_EVENT_UNREGISTER = 'unregister'
export const CHALLENGE_EVENT_ACCEPT = 'accept'

@Injectable()
export class ChallengeService {
  constructor(
    private gameService: GameService
  ) { }

  private challenges: Challenge[] = []

  private challengeClients: Record<string, any> = {}

  private callbacks: Record<string, ChallengeCallback> = {}

  register(challenge: Challenge, client: any) {
    this.challenges.push(challenge)
    this.challengeClients[challenge.id] = client

    this.sendOut(CHALLENGE_EVENT_REGISTER, challenge)
    return this.challenges;
  }

  unregister(userId: string) {
    const challengeToRemove = this.challenges.find(({ userId: id }) => id == userId)
    this.challenges = this.challenges.filter(({ userId: id }) => id !== userId)
    if (!challengeToRemove) return;
    delete this.challengeClients[challengeToRemove.id];
    this.sendOut(CHALLENGE_EVENT_UNREGISTER, challengeToRemove.id)
  }

  accept(challengeId: string, playerId: string, deck: string[]): string | null {    
    const challenge: Challenge = this.challenges.find(({id}) => id === challengeId)
    // Break on no challenge
    if (!challenge) return null
    // Cannot accept own challenge
    if (challenge.userId === playerId) return null

    const [secretOne, secretTwo] = this.gameService.create(
      challenge.userId.toString(),
      playerId,
      challenge.deck,
      deck
    )

    this.challenges = this.challenges.filter(item => item.id !== challengeId);
    delete this.challengeClients[challengeId];

    this.sendOut(CHALLENGE_EVENT_ACCEPT, {
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

  getPublicChallenges(): Omit<Challenge, 'deck'>[] {
    return this.challenges.map(({ deck, ...challenge }) => challenge);
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
