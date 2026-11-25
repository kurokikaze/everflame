const { test } = require('node:test');
const assert = require('node:assert/strict');
const { NestFactory } = require('@nestjs/core');
const { Module } = require('@nestjs/common');
const { io } = require('socket.io-client');
const { GameModule } = require('../dist/game/game.module.js');
const { GameService } = require('../dist/game/gameService.js');
const { ChallengeService } = require('../dist/challengeService.js');
const { ChallengeController } = require('../dist/challenge.controller.js');
const ContainedEngine = require('../dist/game/ContainedEngine.js').default;
const { State } = require('moonlands/dist/esm/index.js');
const CardInGame = require('moonlands/dist/esm/classes/CardInGame.js').default;
const Zone = require('moonlands/dist/esm/classes/Zone.js').default;
const { byName } = require('moonlands/dist/esm/cards.js');
const C = require('moonlands/dist/esm/const.js');

const deck = ['Grega', 'Sinder', 'Ashgar', ...Array(12).fill('Arbolit')];
function next(socket, event, predicate = () => true) {
    return new Promise((resolve, reject) => {
        const listener = value => { if (predicate(value)) { cleanup(); resolve(value); } };
        const cleanup = () => { clearTimeout(timer); socket.off(event, listener); };
        const timer = setTimeout(() => { cleanup(); reject(new Error(`Timed out waiting for ${event}`)); }, 5000);
        socket.on(event, listener);
    });
}

test('two Waystone sockets authenticate, receive hidden views, exchange actions and reconnect', { timeout: 30000 }, async t => {
    const app = await NestFactory.create(GameModule, { logger: false });
    const clients = [];
    t.after(async () => { clients.forEach(client => client.disconnect()); await app.close(); });
    await app.listen(0, '127.0.0.1');
    const service = app.get(GameService);
    const secrets = service.create('host', 'guest', deck, deck);
    const engine = service.getGame(service.resolveSecret(secrets[0])[0]);
    const url = `http://127.0.0.1:${app.getHttpServer().address().port}/game`;
    async function connect(secret, object = false) {
        const socket = io(url, { autoConnect: false, transports: ['websocket'], forceNew: true, reconnection: false });
        clients.push(socket);
        const connected = next(socket, 'connect'); socket.connect(); await connected;
        const initial = next(socket, 'message', message => message.type === 'setInitialState');
        socket.emit('secret', object ? { secret } : JSON.stringify({ secret }));
        return { socket, state: (await initial).state };
    }
    const first = await connect(secrets[0]);
    const second = await connect(secrets[1], true);
    const sockets = [first.socket, second.socket];
    assert.equal(first.state.playerNumber, 1); assert.equal(second.state.playerNumber, 2);
    for (let actions = 0; actions < 5 && !engine.getSerializedState(1).zones.playerHand.length && !engine.getSerializedState(2).zones.playerHand.length; actions++) {
        const game = engine.gameState;
        const player = game.state.prompt ? game.state.promptPlayer : game.getControllingPlayer();
        const received = next(sockets[player - 1], 'message');
        sockets[player - 1].send(game.state.prompt ? { type: C.ACTION_RESOLVE_PROMPT, cards: [] } : { type: C.ACTION_PASS });
        await received;
        // Synchronize on the resulting snapshot rather than assuming how many events the engine emits.
        await new Promise(resolve => setTimeout(resolve, 10));
    }
    const player = engine.gameState.getControllingPlayer();
    const view = engine.getSerializedState(player);
    assert.ok(view.zones.playerHand.length > 0);
    assert.ok(view.zones.playerHand.every(card => card.card === 'Arbolit'));
    const otherView = engine.getSerializedState(3 - player);
    assert.ok(otherView.zones.opponentHand.every(card => card.card === null));

    const original = JSON.stringify(engine.getSerializedState(1));
    let rejected = next(sockets[2 - player], 'action_error');
    sockets[2 - player].send({ type: C.ACTION_PASS, player }); await rejected;
    assert.equal(JSON.stringify(engine.getSerializedState(1)), original);
    rejected = next(sockets[player - 1], 'action_error');
    sockets[player - 1].send({ type: C.ACTION_EFFECT, effectType: C.EFFECT_TYPE_ADD_ENERGY_TO_MAGI, amount: 100 }); await rejected;
    assert.equal(JSON.stringify(engine.getSerializedState(1)), original);

    const changed = next(sockets[2 - player], 'message', action => action.type === C.ACTION_PASS);
    sockets[player - 1].send({ type: C.ACTION_PASS, player: 3 - player });
    await changed;
    assert.equal(engine.gameState.state.step, 2);
    const replacement = await connect(secrets[player - 1]);
    assert.equal(replacement.state.step, 2);
    assert.equal(replacement.state.playerNumber, player);
    const refreshed = next(replacement.socket, 'message', action => action.type === 'setInitialState');
    replacement.socket.emit('secret', JSON.stringify({ secret: secrets[player - 1] })); await refreshed;
    const passed = next(replacement.socket, 'message', action => action.type === C.ACTION_PASS);
    replacement.socket.send({ type: C.ACTION_PASS }); await passed;
    assert.equal(engine.gameState.state.step, 3, 'Repeated authentication must not install duplicate action handlers');
    const bad = io(url, { autoConnect: false, transports: ['websocket'], forceNew: true }); clients.push(bad);
    const connected = next(bad, 'connect'); bad.connect(); await connected;
    const denied = next(bad, 'game_error'); bad.emit('secret', JSON.stringify({ secret: 'a1' })); await denied;
});

test('server accepts Will of Orothe attacks only from the controlling socket identity', () => {
    const engine = new ContainedEngine(deck, deck);
    const card = (name, owner, energy) => new CardInGame(byName(name), owner).addEnergy(energy);
    const bwill = card('Bwill', 1, 1), attacker = card('Colossus', 2, 20);
    const definition = byName('Will of Orothe').data.effects.find(effect => effect.staticAbilities?.some(ability => ability.property === C.PROPERTY_CONTROLLING_PLAYER));
    const effect = { ...definition, generatedBy: 'will', player: 1, expiration: { ...definition.expiration, active: true, turnPlayer: 2 },
        staticAbilities: definition.staticAbilities.map(ability => ({ ...ability, selectorParameter: 2, modifier: { ...ability.modifier, operandOne: 1 } })) };
    const game = new State({ activePlayer: 2, controllingPlayer: 2, step: 2, continuousEffects: [effect], zones: [
        new Zone('In play', C.ZONE_TYPE_IN_PLAY).add([bwill, attacker]),
        ...[1, 2].flatMap(player => [new Zone('Magi', C.ZONE_TYPE_ACTIVE_MAGI, player).add([card('Grega', player, 10)]), new Zone('Discard', C.ZONE_TYPE_DISCARD, player)]),
    ] });
    game.setPlayers(1, 2);
    Object.defineProperty(engine, 'gameState', { value: game });
    assert.equal(engine.update({ type: C.ACTION_PASS, player: 1 }, 2), false);
    assert.equal(engine.update({ type: C.ACTION_ATTACK, source: attacker.id, target: bwill.id }, 1), true);
    assert.equal(game.getZone(C.ZONE_TYPE_IN_PLAY).cards.length, 0);
    assert.equal(engine.update({ type: C.ACTION_PASS }, 1), true);
    assert.equal(game.state.step, 3);
});

test('challenge acceptance gives both clients secrets for the same game without exposing decks', { timeout: 15000 }, async t => {
    class TestModule {}
    Module({ imports: [GameModule], controllers: [ChallengeController] })(TestModule);
    const app = await NestFactory.create(TestModule, { logger: false });
    const clients = [];
    t.after(async () => { clients.forEach(client => client.disconnect()); await app.close(); });
    await app.listen(0, '127.0.0.1');
    const url = `http://127.0.0.1:${app.getHttpServer().address().port}`;
    async function connect() {
        const socket = io(`${url}/challenge`, { autoConnect: false, transports: ['websocket'], forceNew: true, reconnection: false });
        clients.push(socket); const connected = next(socket, 'connect'); socket.connect(); await connected; return socket;
    }
    const host = await connect(), guest = await connect();
    const created = next(guest, 'message', message => message.event === 'new_challenge');
    host.emit('create', JSON.stringify({ deck, comment: 'Network test' }));
    const challenge = (await created).data;
    assert.equal(challenge.name, 'Network test');
    assert.equal('deck' in challenge, false);
    const publicChallenges = await (await fetch(`${url}/challenges/list`)).json();
    assert.equal(publicChallenges.length, 1);
    assert.equal('deck' in publicChallenges[0], false);
    const hostAccepted = next(host, 'message', message => message.event === 'challenge_accepted');
    const guestAccepted = next(guest, 'message', message => message.event === 'challenge_accepted');
    guest.emit('accept', JSON.stringify({ challengeId: challenge.id, deck }));
    const hostSecret = (await hostAccepted).data, guestSecret = (await guestAccepted).data;
    const service = app.get(GameService);
    assert.notEqual(hostSecret, guestSecret);
    assert.deepEqual(service.resolveSecret(hostSecret), [service.resolveSecret(guestSecret)[0], 1]);
    assert.equal(service.resolveSecret(guestSecret)[1], 2);
    assert.equal(app.get(ChallengeService).getChallenges().length, 0);
    assert.equal(service.getGames().length, 1);
});
