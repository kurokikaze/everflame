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
import { CHALLENGE_EVENT_ACCEPT, CHALLENGE_EVENT_REGISTER, CHALLENGE_EVENT_UNREGISTER, ChallengeService } from "./challengeService";
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

const CLIENT_CHALLENGE_EVENT_INITIAL = 'response'
const CLIENT_CHALLENGE_EVENT_CREATE = 'new_challenge'
const CLIENT_CHALLENGE_EVENT_DELETE = 'remove_challenge'
const CLIENT_CHALLENGE_EVENT_ACCEPT = 'challenge_accepted'

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
        this.logger.log(`Client id: ${client.id} connected`)
        // this.logger.debug(`Number of connected clients: ${sockets.size}`)
        const challenges = this.challengeService.getChallenges()
        const clientChallenges = challenges.map((challenge): ClientChallenge => mapChallengeToClient(challenge, client.id))
        // subscribe the player here
        const remover = this.challengeService.onChange((type, argument) => {
            switch (type) {
                case CHALLENGE_EVENT_REGISTER: {
                    client.send({ event: CLIENT_CHALLENGE_EVENT_CREATE, data: mapChallengeToClient(argument, client.id) })
                    break;
                }
                case CHALLENGE_EVENT_UNREGISTER: {
                    client.send({ event: CLIENT_CHALLENGE_EVENT_DELETE, data: argument })
                    break;
                }
                case CHALLENGE_EVENT_ACCEPT: {
                    if (client.id === argument.userId) {
                        // If it was our challenge, we should receive the secret
                        this.logger.debug(`Challenge secret (host) ${argument.secret}`)
                        client.send({ event: CLIENT_CHALLENGE_EVENT_ACCEPT, data: argument.secret })
                        remover()
                        client.disconnect()
                    } else {
                        // Otherwise, just drop it from the list
                        client.send({ event: CLIENT_CHALLENGE_EVENT_DELETE, data: argument.challengeId })
                    }
                    break;
                }
            }
        })
        client.on('disconnect', () => remover())
        console.log(`Sending out ${clientChallenges.length} challenges`)
        client.send({ event: CLIENT_CHALLENGE_EVENT_INITIAL, data: clientChallenges })
    }

    handleDisconnect(_client: any) {
        this.logger.debug('Disconnected')
    }

    @SubscribeMessage('create')
    handleCreate(
        @ConnectedSocket() client: any,
        @MessageBody() payload: any,
    ): WsResponse<unknown> {
        this.logger.debug(`Create challenge from ${client.id}`)
        const { deck, comment } = JSON.parse(payload)
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
        return { event: CLIENT_CHALLENGE_EVENT_INITIAL, data: this.challengeService.getChallenges().map((challenge): ClientChallenge => mapChallengeToClient(challenge, client.id)) };
    }

    @SubscribeMessage('delete')
    handleDelete(
        client: any
    ): WsResponse<unknown> {
        this.logger.debug(`Delete challenge from ${client.id}`)
        // this.logger.debug(`Data: ${payload}`)
        this.challengeService.unregister(client.id)
        client.send({ event: 'response', data: this.challengeService.getChallenges().map((challenge): ClientChallenge => mapChallengeToClient(challenge, client.id)) })

        return null;
    }

    @SubscribeMessage('accept')
    handleAccept(
        @ConnectedSocket() client: any,
        @MessageBody() payload: any
    ): WsResponse<unknown> {
        const { challengeId, deck } = JSON.parse(payload)
        this.logger.debug(`Accepting challenge ${challengeId}`)
        this.logger.debug(deck)
        const secret = this.challengeService.accept(challengeId, client.id, deck)
        this.logger.debug(`Challenge secret (challenger) ${secret}`)
        client.send({ event: CLIENT_CHALLENGE_EVENT_ACCEPT, data: secret })
        client.disconnect()
        return null
    }
}