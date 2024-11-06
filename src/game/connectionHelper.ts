import { State } from "moonlands/dist/cjs/index";
import { Socket } from "socket.io";
import { convertServerCommand } from "./utils";

export function connectionHelper(client: Socket, state: State, playerNumber: number) {

    client.on('data', (action) => {
        const serverCommand = convertServerCommand(action, state, playerNumber);

        state.update(serverCommand)
    })
}