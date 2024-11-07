import { Injectable } from '@nestjs/common';
import { Challenge } from './types';
import { v4 } from 'uuid';
import { GameService } from './game/gameService';

const testDeck = [
    'Pruitt',
    'Poad',
    'Yaki',
    'Leaf Hyren',
    'Leaf Hyren',
    'Leaf Hyren',
    'Weebo',
    'Weebo',
    'Weebo',
    'Arboll',
    'Arboll',
    'Arboll',
    'Giant Carillion',
    'Giant Carillion',
    'Giant Carillion',
    'Furok',
    'Furok',
    'Furok',
    'Balamant',
    'Balamant',
    'Balamant',
    'Grow',
    'Grow',
    'Grow',
    'Timber Hyren',
    'Timber Hyren',
    'Water of Life',
    'Water of Life',
    'Syphon Stone',
    'Syphon Stone',
    'Carillion',
    'Carillion',
    'Carillion',
    'Rudwot',
    'Rudwot',
    'Rudwot',
    'Stagadan',
    'Stagadan',
    'Stagadan',
    'Robe of Vines',
    'Robe of Vines',
    'Robe of Vines',
    'Sea Barl',
]

const testChallenge: Challenge = {
  comment: 'Evu challenges you',
  dateCreated: new Date(),
  deck: testDeck,
  userId: '12',
  id: v4()
}

type ChallengeCallback = (event: string, dto: any) => void

export const CHALLENGE_EVENT_REGISTER = 'register'
export const CHALLENGE_EVENT_UNREGISTER = 'unregister'
export const CHALLENGE_EVENT_ACCEPT = 'accept'

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

    this.sendOut(CHALLENGE_EVENT_REGISTER, challenge)
    return this.challenges;
  }

  unregister(userId: string) {
    const challengeToRemove = this.challenges.find(({ userId: id }) => id == userId)
    this.challenges = this.challenges.filter(({ userId: id }) => id !== userId)
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

  onChange(callback: ChallengeCallback) {
    const callbackId = v4()

    this.callbacks[callbackId] = callback

    return () => { delete this.callbacks[callbackId] }
  }

  sendOut(type: string, argument: any) {
    Object.values(this.callbacks).forEach(callback => callback(type, argument))
  }
}
