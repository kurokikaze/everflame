import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import ContainedEngine from './ContainedEngine';
import { Socket } from 'socket.io';

type GameEntry = { id: string; playerOne: string; playerOneSecret: string; playerTwo: string; playerTwoSecret: string; engine: ContainedEngine };

@Injectable()
export class GameService {
    private gamesRunning: Record<string, GameEntry> = {};
    private secretToGame: Record<string, [string, number]> = {};
    private bindings = new WeakMap<Socket, () => void>();
    private playerSockets = new Map<string, Socket>();
    private readonly logger = new Logger(GameService.name);

    create(playerOne: string, playerTwo: string, deckOne: string[], deckTwo: string[]): [string, string] {
        const id = randomUUID();
        const playerOneSecret = randomUUID();
        const playerTwoSecret = randomUUID();
        const engine = new ContainedEngine(deckOne, deckTwo);
        this.gamesRunning[id] = { id, playerOne, playerTwo, engine, playerOneSecret, playerTwoSecret };
        this.secretToGame[playerOneSecret] = [id, 1];
        this.secretToGame[playerTwoSecret] = [id, 2];
        return [playerOneSecret, playerTwoSecret];
    }

    resolveSecret(secret: string): [string, number] | null {
        return typeof secret === 'string' && Object.hasOwn(this.secretToGame, secret) ? this.secretToGame[secret] : null;
    }

    connectWithSecret(secret: string, client: Socket): boolean {
        const result = this.resolveSecret(secret);
        if (!result) { client.emit('game_error', { message: 'Invalid game secret' }); return false; }
        const [gameId, player] = result;
        const engine = this.getGame(gameId);
        if (!engine) { client.emit('game_error', { message: 'Game not found' }); return false; }
        this.bindings.get(client)?.();
        const key = `${gameId}:${player}`;
        const previous = this.playerSockets.get(key);
        if (previous && previous !== client) previous.disconnect(true);
        const unsubscribe = engine.subscribe(player, command => client.send(command));
        const onMessage = (message: unknown) => {
            try {
                if (!engine.update(message, player)) client.emit('action_error', { message: 'Action is not allowed' });
            } catch {
                this.logger.warn(`Rejected invalid action from player ${player}`);
                client.emit('action_error', { message: 'Invalid action' });
            }
        };
        const cleanup = () => {
            unsubscribe();
            client.off('message', onMessage);
            client.off('disconnect', cleanup);
            if (this.playerSockets.get(key) === client) this.playerSockets.delete(key);
            if (this.bindings.get(client) === cleanup) this.bindings.delete(client);
        };
        this.bindings.set(client, cleanup);
        this.playerSockets.set(key, client);
        client.on('message', onMessage);
        client.once('disconnect', cleanup);
        client.send({ type: 'setInitialState', state: engine.getSerializedState(player) });
        return true;
    }

    getGame(id: string): ContainedEngine | null { return this.gamesRunning[id]?.engine ?? null; }
    getGames() { return Object.values(this.gamesRunning).map(({ id, playerOne, playerTwo }) => ({ id, playerOne, playerTwo })); }
}
