import { Logger } from "@nestjs/common";
import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
    WsResponse,
} from "@nestjs/websockets";

import { Server, Socket } from "socket.io";
import { GameService } from "./gameService";

@WebSocketGateway({
    cors: true,
    namespace: /game\/[a-zA-Z0-9-]/g
})

export class GameGateway
    implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    constructor(
        private gameService: GameService,
    ) { }
    private readonly logger = new Logger(GameGateway.name);

    @WebSocketServer() io: Server;

    afterInit() {
        this.logger.debug(`Server initialized`)
    }

    handleConnection(
        @ConnectedSocket() client: Socket
    ) {
        this.logger.log(`Client id: ${client.id} connected`)
        this.logger.log(`Connection namespace: ${client.nsp.name}`)
        const playerSecret = client.nsp.name.split('/')[2]
        this.logger.log(`Player secret: ${playerSecret}`)
        this.gameService.connectWithSecret(playerSecret, client)
    }

    handleDisconnect(_client: any) {
        this.logger.debug('Disconnected')
    }

    @SubscribeMessage('game')
    handleEvent(
        client: any, payload: any
    ): WsResponse<unknown> {
        this.logger.debug(`Game Event from ${client.id}`)
        this.logger.debug(`Data: ${payload}`)
        return { event: 'response', data: payload };
    }

    @SubscribeMessage('auth')
    handleAuth(
        client: any, payload: any
    ): WsResponse<unknown> {
        let authorized = true
        this.logger.debug(`Authorizing client ${client.id}`)
        return { event: 'response', data: { authorized } }
    }

    onEvent(@MessageBody() data: unknown) {
        this.logger.debug(`onEvent handler`)
        this.io.send('game', { whoo: true })
    }
}