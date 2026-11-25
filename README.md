# Everflame

Authoritative multiplayer server for Magi-Nation Duel. Waystone uses Socket.IO
instead of its local engine worker; game rules run in Moonlands on the server.
Client/server commands and visibility rules come from `duel-protocol`.

## Requirements and installation

Use Node.js 22.13 or newer (tested with Node.js 24). The server loads the same
ESM Moonlands build as duel-protocol, including when Nest runs as CommonJS.

```sh
npm ci
npm run build
```

Moonlands 0.45.0 and duel-protocol 0.3.5 are installed from GitHub archives.
NestJS 10 and MikroORM 6 remain on compatible patch/minor releases. Updating
these frameworks to new major versions is a separate migration.

Copy `.env.example` to `.env` and configure the application ID, token secrets,
SMTP settings and server port. `DATABASE_URL` is the SQLite file path. Existing
databases are not recreated or migrated on startup.

The account API also requires an RSA key pair at `keys/id_rsa` (private PEM) and
`keys/id_rsa.pub` (public PEM), as read by `src/config/index.ts`. The keys and
`.env` are excluded from Git. Replace the example token/cookie secret values
when configuring an installation.

```sh
npm run start:dev
# Or, after building:
npm run start:prod
```

The server listens on `PORT`. Configure the Waystone server address or reverse
proxy to reach that port; the current client uses `/challenge` and `/game`
Socket.IO namespaces. Socket.IO is not a raw WebSocket protocol.

## Network flow

1. Connect to `/challenge`. The `message` event carries `{ event, data }` lobby
   messages: `response`, `new_challenge`, `remove_challenge`, `challenge_accepted`.
2. Send `create` with JSON `{ deck, comment }`, or `accept` with JSON
   `{ challengeId, deck }`. Acceptance gives each participant a separate secret
   through `challenge_accepted` and closes the lobby connection.
3. Connect to `/game` and emit `secret` with JSON `{ secret }` (an object is also
   accepted). The server responds on `message` with
   `{ type: 'setInitialState', state }`, including the assigned `playerNumber`.
4. Send duel-protocol actions using `socket.send(action)`. Server commands arrive
   through `message`, matching Waystone's local engine command stream.

The secret determines the acting player; the payload cannot impersonate another
player or inject engine effects. Actions are accepted only with the appropriate
priority, including prompts and Will of Orothe attack control. Opponent hands
and unrevealed cards stay hidden. Public challenge lists omit submitted decks.
Invalid authentication emits `game_error`; rejected actions emit `action_error`.
Reconnecting with the same secret replaces the previous game socket and sends a
fresh snapshot. Repeating authentication does not duplicate action handlers.

Challenges and running games are held in memory. Restarting Everflame loses
those sessions; SQLite stores accounts, not resumable matches.

## Tests

```sh
npm test -- --runInBand
npm run test:e2e
```

Unit smoke tests use isolated database/configuration dependencies. End-to-end
checks build the server and use real Socket.IO clients on temporary local ports:
challenge creation/acceptance, game secrets, hidden hands, action exchange,
identity/priority checks, reconnection and Will of Orothe. They do not read or
modify the working account database or send email.
