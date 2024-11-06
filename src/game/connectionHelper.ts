import { State } from "moonlands/src/index";
import { Socket } from "socket.io";
import { convertServerCommand } from "./utils";
import { EventEmitter } from "stream";

export function connectionHelper(client: Socket, state: State, playerNumber: number) {

    client.on('data', (action) => {
        const serverCommand = convertServerCommand(action, state, playerNumber);

        state.update(serverCommand)
    })
}