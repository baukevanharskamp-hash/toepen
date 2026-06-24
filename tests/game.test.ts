import assert from "node:assert/strict";
import test from "node:test";
import { legalCards, makeDeck, trickWinner } from "../lib/game";

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
