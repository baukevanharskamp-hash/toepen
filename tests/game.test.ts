import assert from "node:assert/strict";
import test from "node:test";
import { legalCards, makeDeck, trickWinner } from "../lib/game";
import { action, createGame, joinGame } from "../lib/store";

test("het Toepen-deck bevat 32 unieke kaarten", () => {
  const deck = makeDeck();
  assert.equal(deck.length, 32);
  assert.equal(new Set(deck.map((card) => card.id)).size, 32);
});

test("kleur bekennen is verplicht", () => {
  const hand = [
    { id: "harten-7", suit: "harten" as const, rank: "7" as const },
    { id: "schoppen-10", suit: "schoppen" as const, rank: "10" as const },
  ];
  assert.deepEqual(legalCards(hand, "harten").map((card) => card.id), ["harten-7"]);
  assert.equal(legalCards(hand, "ruiten").length, 2);
});

test("10 is de hoogste kaart binnen de gevraagde kleur", () => {
  const winner = trickWinner([
    { playerId: "a", card: { id: "harten-A", suit: "harten", rank: "A" } },
    { playerId: "b", card: { id: "harten-10", suit: "harten", rank: "10" } },
    { playerId: "c", card: { id: "schoppen-10", suit: "schoppen", rank: "10" } },
  ]);
  assert.equal(winner, "b");
});

test("een speler die gepast heeft kan niet meer toepen", () => {
  const { game, token: hostToken } = createGame({ name: "Host", maxPlayers: 2, task: "test" });
  const guest = joinGame(game, "Gast");
  action(game, hostToken, "ready");
  action(game, guest.token, "ready");
  action(game, hostToken, "start");
  action(game, hostToken, "toep");
  action(game, guest.token, "respond", { choice: "fold" });
  assert.throws(() => action(game, guest.token, "toep"), /niet meer meedoet/);
});

test("een speler kan niet over zichzelf heen toepen", () => {
  const { game, token: hostToken } = createGame({ name: "Host", maxPlayers: 2, task: "test" });
  const guest = joinGame(game, "Gast");
  action(game, hostToken, "ready");
  action(game, guest.token, "ready");
  action(game, hostToken, "start");
  action(game, hostToken, "toep");
  action(game, guest.token, "respond", { choice: "stay" });
  assert.throws(() => action(game, hostToken, "toep"), /over jezelf heen/);
});

test("een speler mag weer toepen nadat iemand anders heeft overgetoept", () => {
  const { game, token: hostToken } = createGame({ name: "Host", maxPlayers: 2, task: "test" });
  const guest = joinGame(game, "Gast");
  action(game, hostToken, "ready");
  action(game, guest.token, "ready");
  action(game, hostToken, "start");
  action(game, hostToken, "toep");
  action(game, guest.token, "respond", { choice: "stay" });
  action(game, guest.token, "toep");
  action(game, hostToken, "respond", { choice: "stay" });
  assert.doesNotThrow(() => action(game, hostToken, "toep"));
});

test("toep-reacties gaan klokrond en daarna blijft de oorspronkelijke beurt aan zet", () => {
  const { game, token: hostToken } = createGame({ name: "Host", maxPlayers: 3, task: "test" });
  const links = joinGame(game, "Links");
  const daarna = joinGame(game, "Daarna");
  action(game, hostToken, "ready");
  action(game, links.token, "ready");
  action(game, daarna.token, "ready");
  action(game, hostToken, "start");
  const originalTurnPlayerId = game.turnPlayerId;

  action(game, hostToken, "toep");
  assert.deepEqual(game.waitingForResponses, [links.id, daarna.id]);
  assert.throws(() => action(game, daarna.token, "respond", { choice: "stay" }), /nog niet aan de beurt/);
  action(game, links.token, "respond", { choice: "stay" });
  assert.deepEqual(game.waitingForResponses, [daarna.id]);
  action(game, daarna.token, "respond", { choice: "fold" });
  assert.deepEqual(game.waitingForResponses, []);
  assert.deepEqual(game.toepResponses.map((response) => [response.playerId, response.choice]), [[links.id, "stay"], [daarna.id, "fold"]]);
  assert.equal(game.toepCallerId, null);
  assert.equal(game.turnPlayerId, originalTurnPlayerId);
});
