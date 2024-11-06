import { Injectable } from '@nestjs/common';
import { v4 } from 'uuid';
import ContainedEngine from './ContainedEngine';
import { Socket } from 'socket.io';
import { ClientCommand } from './clientProtocol';

type GameEntry = {
    id: string
    playerOne: string
    playerOneSecret: string
    playerTwo: string
    playerTwoSecret: string
    engine: ContainedEngine
}

@Injectable()
export class GameService {
    private gamesRunning: Record<string, GameEntry> = {}
    private secretToGame: Record<string, [string, number]> = {
        a1: ['testGame', 1],
        a2: ['testGame', 2]
    }

    create(playerOne: string, playerTwo: string, deckOne: string[], deckTwo: string[]): [string, string] {
        const id = v4()
        const playerOneSecret = v4()
        const playerTwoSecret = v4()

        const entry: GameEntry = {
            id,
            playerOne,
            playerTwo,
            engine: new ContainedEngine(deckOne, deckTwo),
            playerOneSecret,
            playerTwoSecret,
        }

        this.saveGameEntry(entry)

        return [playerOneSecret, playerTwoSecret]
    }

    private saveGameEntry(entry: GameEntry) {
        this.gamesRunning[entry.id] = entry
        this.secretToGame[entry.playerOneSecret] = [entry.id, 1]
        this.secretToGame[entry.playerTwoSecret] = [entry.id, 2]
    }

    resolveSecret(secret: string): [string, number] | null {
        if (!(secret in this.secretToGame)) {
            return null
        }

        return this.secretToGame[secret]
    }
    
    connectWithSecret(secret: string, client: Socket) {
        const result = this.resolveSecret(secret)

        if (!result) return;

        const [gameId, playerNumber] = result

        const engine = this.getGame(gameId)

        if (playerNumber == 1) {
            engine.setPlayerOneCallback((command: ClientCommand) => {
                client.send(command)
            })
            const serializedState = engine.getSerializedState(1)
            client.send({
                type: 'setInitialState',
                state: serializedState,
            })
            client.on('disconnect', () => engine.setPlayerOneCallback(() => {}))
        } else {
            engine.setPlayerOneCallback((command: ClientCommand) => {
                client.send(command)
            })
            const serializedState = engine.getSerializedState(2)
            client.send({
                type: 'setInitialState',
                state: serializedState,
            })
            client.on('disconnect', () => engine.setPlayerTwoCallback(() => {}))
        }

        client.on('data', message => {
            engine.update(message)
        })
    }

    getGame(id: string): ContainedEngine|null {
        if (!(id in this.gamesRunning)) return null
        return this.gamesRunning[id].engine
    }

    getGames() {
        return Object.values(this.gamesRunning).map(({id, playerOne, playerTwo}) => ({id, playerOne, playerTwo}));
    }
}
