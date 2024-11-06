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
import { ChallengeService } from "./challengeService";
import { v4 } from "uuid";
import { Challenge } from "./types";

type ClientChallenge = {
    id: string
    name: string
    created: Date
    own: boolean
}

function mapChallengeToClient(challenge: Challenge, clientId: string): ClientChallenge {
    return {
        name: challenge.comment,
        created: challenge.dateCreated,
        id: challenge.id,
        own: challenge.userId == clientId
    }
}
@WebSocketGateway({
    cors: true,
    namespace: 'challenge'
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
        // const { sockets } = this.io.sockets;

        this.logger.log(`Client id: ${client.id} connected`)
        // this.logger.debug(`Number of connected clients: ${sockets.size}`)
        const challenges = this.challengeService.getChallenges()
        const clientChallenges = challenges.map((challenge): ClientChallenge => mapChallengeToClient(challenge, client.id))
        // subscribe the player here
        const remover = this.challengeService.onChange((type, argument) => {
            switch (type) {
                case 'register': {
                    client.send({ event: 'new_challenge', data: argument })
                    break;
                }
                case 'unregister': {
                    client.send({ event: 'remove_challenge', data: argument })
                    break;
                }
                case 'accept': {
                    if (client.id === argument.userId) {
                        // If it was our challenge, we should receive the secret
                        this.logger.debug(`Challenge secret (challenger) ${argument.secret}`)
                        client.send({ event: 'challenge_accepted', data: argument.secret })
                    } else {
                        // Otherwise, just drop it from the list
                        client.send({ event: 'remove_challenge', data: argument.challengeId })
                    }
                    break;
                }
            }
        })
        client.on('disconnect', () => remover())
        client.send({ event: 'response', data: clientChallenges })
    }

    handleDisconnect(_client: any) {
        this.logger.debug('Disconnected')
    }

    @SubscribeMessage('create')
    handleCreate(
        @ConnectedSocket() client: any,
        @MessageBody() payload: any,
        // @MessageBody('deck') deck: string[],
        // @MessageBody('comment') comment: string,
    ): WsResponse<unknown> {
        this.logger.debug(`Create challenge from ${client.id}`)
        const {deck, comment} = JSON.parse(payload)
        //const payloadData = JSON.parse(payload)
        if (!this.challengeService.hasChallenge(client.id)) {
            const challengeId = v4()
            this.challengeService.register({
                deck: deck,
                userId: client.id,
                dateCreated: new Date(),
                comment: comment,
                id: challengeId,
            }, client)

            client.on('disconnect', () => {
                this.challengeService.unregister(client.id)
            })
        }
        return { event: 'response', data: this.challengeService.getChallenges().map((challenge): ClientChallenge => mapChallengeToClient(challenge, client.id)) };
    }

    @SubscribeMessage('delete')
    handleDelete(
        client: any
    ): WsResponse<unknown> {
        this.logger.debug(`Delete challenge from ${client.id}`)
        // this.logger.debug(`Data: ${payload}`)
        this.challengeService.unregister(client.id)
        return { event: 'response', data: this.challengeService.getChallenges().map((challenge): ClientChallenge => mapChallengeToClient(challenge, client.id)) };
    }

    @SubscribeMessage('accept')
    handleAuth(
        client: any, payload: any
    ): WsResponse<unknown> {
        this.logger.debug(`Accepting challenge by ${client.id}`)
        const secret = this.challengeService.accept(payload.challengeId, client.id, payload.deck)
        this.logger.debug(`Challenge secret (host) ${secret}`)
        return { event: 'challenge_accepted', data: secret }
    }

    onEvent(@MessageBody() data: unknown) {
        this.logger.debug(`onEvent handler`)
        this.io.send('game', { whoo: true })
    }
}