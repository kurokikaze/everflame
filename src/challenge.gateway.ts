import { Logger } from "@nestjs/common";
import {
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
import { ChallengeService } from "./challengeService";
import { v4 } from "uuid";

type ClientChallenge = {
    id: string
    name: string
    created: Date
    own: boolean
}

@WebSocketGateway({
    cors: true,
})
export class ChallengeGateway
    implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private readonly logger = new Logger(ChallengeGateway.name);

    constructor(
        private readonly challengeService: ChallengeService
    ) { }

    @WebSocketServer() io: Server;

    afterInit() {
        this.logger.debug(`Server initialized`)
    }

    handleConnection(client: any, ...args: any[]) {
        const { sockets } = this.io.sockets;

        this.logger.log(`Client id: ${client.id} connected`)
        this.logger.debug(`Number of connected clients: ${sockets.size}`)
        const challenges = this.challengeService.getChallenges()
        const clientChallenges = challenges.map((challenge): ClientChallenge => {
            return {
                name: challenge.comment,
                created: challenge.dateCreated,
                id: challenge.id,
                own: challenge.userId == client.id
            }
        })
        // subscribe the player here
        client.send({ event: 'response', data: clientChallenges })
    }

    handleDisconnect(_client: any) {
        this.logger.debug('Disconnected')
    }

    @SubscribeMessage('create')
    handleCreate(
        client: any, payload: any
    ): WsResponse<unknown> {
        this.logger.debug(`Create challenge from ${client.id}`)
        this.challengeService.register({
            deck: payload.deck,
            userId: client.id,
            dateCreated: new Date(),
            comment: payload.comment,
            id: v4(),
        })
        this.logger.debug(`Data: ${payload}`)
        return { event: 'response', data: this.challengeService.getChallenges() };
    }

    @SubscribeMessage('delete')
    handleDelete(
        client: any, payload: any
    ): WsResponse<unknown> {
        this.logger.debug(`Create challenge from ${client.id}`)
        this.logger.debug(`Data: ${payload}`)
        this.challengeService.unregister(client.id)
        return { event: 'response', data: this.challengeService.getChallenges() };
    }

    @SubscribeMessage('accept')
    handleAuth(
        client: any, payload: any
    ): WsResponse<unknown> {
        let authorized = true
        this.logger.debug(`Accepting challenge by ${client.id}`)
        return { event: 'response', data: { authorized } }
    }

    onEvent(@MessageBody() data: unknown) {
        this.logger.debug(`onEvent handler`)
        this.io.send('game', { whoo: true })
    }
}