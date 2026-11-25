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
    namespace: 'game'
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
        this.logger.debug(`Client ${client.id} connected; waiting for game secret`)
    }

    handleDisconnect(_client: any) {
        this.logger.debug('Disconnected')
    }

    @SubscribeMessage('secret')
    handleSecret(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: string | { secret: string },
    ) {
        try {
            const data = typeof payload === 'string' ? JSON.parse(payload) : payload;
            this.gameService.connectWithSecret(data?.secret, client);
        } catch {
            client.emit('game_error', { message: 'Invalid game secret' });
        }
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
