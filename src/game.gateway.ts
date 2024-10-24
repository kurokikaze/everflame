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

import { Server } from "socket.io";

@WebSocketGateway({
    cors: true,
})
export class GameGateway
    implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
        private readonly logger = new Logger(GameGateway.name);

    @WebSocketServer() io: Server;

    afterInit() {
        this.logger.debug(`Server initialized`)
    }

    handleConnection(client: any, ...args: any[]) {
        const { sockets } = this.io.sockets;

        this.logger.log(`Client id: ${client.id} connected`)
        this.logger.debug(`Number of connected clients: ${sockets.size}`)
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
        return { event: 'response', data: { authorized }}
    }

    onEvent(@MessageBody() data: unknown) {
        this.logger.debug(`onEvent handler`)
        this.io.send('game', { whoo: true })
    }
}