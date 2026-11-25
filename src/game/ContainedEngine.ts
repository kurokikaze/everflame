import { randomInt } from 'node:crypto';
import { State } from 'moonlands/dist/esm/index.js';
import * as C from 'moonlands/dist/esm/const.js';
import type { ClientCommand } from 'duel-protocol';
import convertClientCommands, { convertServerCommand } from 'duel-protocol/commands';

const clientActions = new Set<string>([C.ACTION_PLAY, C.ACTION_POWER, C.ACTION_ATTACK, C.ACTION_PASS, C.ACTION_RESOLVE_PROMPT, C.ACTION_CONCEDE]);
type Callback = (command: ClientCommand) => void;

export default class ContainedEngine {
    protected readonly gameState: State;
    private callbacks = new Map<number, Callback>();

    constructor(deck1: string[], deck2: string[]) {
        this.gameState = new State({
            actions: [], savedActions: [], delayedTriggers: [], mayEffectActions: [], fallbackActions: [],
            continuousEffects: [], activePlayer: 1, controllingPlayer: 1, prompt: false,
            promptType: null, promptParams: {}, log: [], step: 0, turn: 0, zones: [], players: [],
            spellMetaData: {}, attachedTo: {}, cardsAttached: {},
        });
        this.gameState.initiatePRNG(randomInt(0, 0x100000000));
        this.gameState.setPlayers(1, 2);
        this.gameState.setDeck(1, deck1);
        this.gameState.setDeck(2, deck2);
        this.gameState.setup();
        this.gameState.setOnAction(action => {
            for (const [player, callback] of this.callbacks) {
                const command = convertServerCommand(action, this.gameState, player);
                if (command) callback(command);
            }
        });
    }

    public subscribe(player: number, callback: Callback): () => void {
        this.callbacks.set(player, callback);
        return () => {
            // A previous socket disconnecting must not detach its replacement.
            if (this.callbacks.get(player) === callback) this.callbacks.delete(player);
        };
    }

    public update(command: unknown, player: number): boolean {
        if (![1, 2].includes(player) || !command || typeof command !== 'object' || Array.isArray(command)) return false;
        const action = command as Record<string, any>;
        if (!clientActions.has(action.type) || this.gameState.hasWinner()) return false;
        const priority = this.gameState.state.prompt ? this.gameState.state.promptPlayer : this.gameState.getControllingPlayer();
        if (action.type !== C.ACTION_CONCEDE && priority !== player) return false;
        if (this.gameState.state.prompt && action.type !== C.ACTION_RESOLVE_PROMPT && action.type !== C.ACTION_CONCEDE) return false;
        if (action.type === C.ACTION_POWER) {
            const source = this.gameState.getZone(C.ZONE_TYPE_IN_PLAY).byId(action.source)
                ?? this.gameState.getZone(C.ZONE_TYPE_ACTIVE_MAGI, player).byId(action.source);
            if (!source || this.gameState.modifyByStaticAbilities(source, C.PROPERTY_CONTROLLER) !== player) return false;
        }
        if (action.type === C.ACTION_ATTACK) {
            const sources = [action.source, ...(Array.isArray(action.additionalAttackers) ? action.additionalAttackers : [])];
            if (sources.some(id => {
                const source = this.gameState.getZone(C.ZONE_TYPE_IN_PLAY).byId(id);
                return !source || this.gameState.modifyByStaticAbilities(source, C.PROPERTY_CONTROLLER) !== this.gameState.state.activePlayer;
            })) return false;
        }
        const converted = convertClientCommands({ ...action, player } as Parameters<typeof convertClientCommands>[0], this.gameState);
        if (!converted) return false;
        if ('player' in converted) converted.player = player;
        return this.gameState.update(converted);
    }

    public getSerializedState(player: number) {
        return { ...this.gameState.serializeData(player, true), playerNumber: player };
    }
}
