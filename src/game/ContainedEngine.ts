import { State } from "moonlands/dist/cjs/index";
import convertClientCommands, { convertServerCommand } from "./utils";
import { AnyEffectType } from "moonlands/dist/cjs/types";
import { ClientCommand } from "./clientProtocol";

export default class ContainedEngine {
    protected gameState: any;
    private playerOneCallback: Function = () => { };
    private playerTwoCallback: Function = () => { };

    constructor(
        deck1: string[],
        deck2: string[],
    ) {
        this.gameState = this.createGame()
        this.gameState.setPlayers(1, 2);
        this.gameState.setDeck(1, deck1);
        this.gameState.setDeck(2, deck2);
        this.gameState.setup();

        const actionCallback = (action: AnyEffectType) => {
            const commandPlayerOne = convertServerCommand(action, this.gameState, 1);

            if (commandPlayerOne) {
                try {
                    this.playerOneCallback(commandPlayerOne)
                } catch (err) {
                    console.error('Error converting the server command')
                    console.dir(err)
                    console.dir(commandPlayerOne)
                }
            }
            const commandPlayerTwo = convertServerCommand(action, this.gameState, 2);

            if (commandPlayerTwo) {
                try {
                    this.playerTwoCallback(commandPlayerTwo)
                } catch (err) {
                    console.error('Error converting the server command')
                    console.dir(err)
                    console.dir(commandPlayerTwo)
                }
            }
        }

        this.gameState.setOnAction(actionCallback);
    }


    private createGame() {
        const defaultState = {
            actions: [],
            savedActions: [],
            delayedTriggers: [],
            mayEffectActions: [],
            fallbackActions: [],
            continuousEffects: [],
            activePlayer: 0,
            prompt: false,
            promptType: null,
            promptParams: {},
            log: [],
            step: 0,
            turn: 0,
            zones: [],
            players: [],
            spellMetaData: {},
            attachedTo: {},
            cardsAttached: {}
        };

        const zones: any[] = []; //createZones(1, 2)
        const game = new State({
            ...defaultState,
            zones,
            activePlayer: 2,
        });

        // @ts-ignore
        game.initiatePRNG(Math.floor(Math.random() * 100));

        game.enableDebug();

        return game;
    }

    public setPlayerOneCallback(callback: Function) {
        this.playerOneCallback = callback
        // send out the initial state immediately?
    }

    public setPlayerTwoCallback(callback: Function) {
        this.playerTwoCallback = callback
        // send out the initial state immediately?
    }

    public update(command: ClientCommand) {
        const convertedCommand = convertClientCommands(command, this.gameState)
        this.gameState.update(convertedCommand)
    }

    public getSerializedState(player: number) {
        const state = this.gameState.serializeData(player, true)
        state.playerNumber = player
        return state
    }
}