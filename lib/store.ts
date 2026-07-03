import { randomUUID } from "crypto";
import { dealRound, finishRound, hasDirtyLaundry, legalCards, makeDeck, nextActive, shuffle, tricksPerRound, trickWinner } from "./game";
import { Game, GameMode, Player } from "./types";

declare global { var toepGames: Map<string, Game> | undefined; }
const games = global.toepGames ?? new Map<string, Game>();
global.toepGames = games;

const avatars = ["🍺", "🃏", "🎯", "🍟", "🎱", "🎸", "⚡", "🥨"];
const code = () => Math.random().toString(36).slice(2, 6).toUpperCase();
const fallbackAvatar = () => avatars[Math.floor(Math.random() * avatars.length)];
const cleanAvatar = (avatar?: string) => {
  if (!avatar) return fallbackAvatar();
  if (avatars.includes(avatar)) return avatar;
  if (avatar.length < 180_000 && /^data:image\/(jpeg|png|webp);base64,/.test(avatar)) return avatar;
  return fallbackAvatar();
};
const player = (name: string, avatar?: string): Player => ({
  id: randomUUID(), token: randomUUID(), name, avatar: cleanAvatar(avatar),
  score: 0, ready: false, active: true, folded: false, hand: [], usedLaundry: false,
});

export function createGame(input: {
  name: string; avatar?: string; maxPlayers: 2 | 3 | 4; task: string; stopAtFirstLoser?: boolean; mode?: GameMode;
}): { game: Game; token: string } {
  const host = player(input.name, input.avatar);
  const mode = input.mode ?? "normal";
  const maxPlayers = mode === "finale" ? 2 : input.maxPlayers;
  const targetScore = mode === "quick" ? 5 : 15;
  let gameCode = code();
  while (games.has(gameCode)) gameCode = code();
  const game: Game = {
    code: gameCode, createdAt: Date.now(), status: "lobby", hostId: host.id,
    maxPlayers, mode, targetScore, task: input.task.trim(), stopAtFirstLoser: input.stopAtFirstLoser ?? true,
    laundryEnabled: true, jackBonusEnabled: true, players: [host], round: 0, roundValue: 1,
    trick: 0, dealerIndex: 0, turnPlayerId: null, leadPlayerId: null, trickCards: [], completedTricks: [],
    lastTrick: [], waitingForResponses: [], discardingPlayerIds: [], starterRolls: [],
    toepCallerId: null, lastToepCallerId: null, toepResponses: [], message: "Wachten op spelers", loserId: null, finalWinnerId: null,
  };
  games.set(gameCode, game);
  return { game, token: host.token };
}

export function getGame(gameCode: string): Game | undefined { return games.get(gameCode.toUpperCase()); }

export function joinGame(game: Game, name: string, avatar?: string) {
  if (game.status !== "lobby") throw new Error("Dit potje is al begonnen.");
  if (game.players.length >= game.maxPlayers) throw new Error("Dit potje zit vol.");
  const joined = player(name, avatar);
  game.players.push(joined);
  game.message = `${joined.name} doet mee`;
  return joined;
}

function me(game: Game, token: string): Player {
  const found = game.players.find((p) => p.token === token);
  if (!found) throw new Error("Je spelerssessie is niet geldig.");
  return found;
}

function toepResponseQueue(game: Game, callerId: string): string[] {
  const start = game.players.findIndex((player) => player.id === callerId);
  if (start < 0) return [];
  return Array.from({ length: game.players.length - 1 }, (_, step) => game.players[(start + step + 1) % game.players.length])
    .filter((player) => player.active && !player.folded)
    .map((player) => player.id);
}

export function action(game: Game, token: string, type: string, payload: Record<string, unknown> = {}) {
  const actor = me(game, token);
  if (type === "stop") {
    if (actor.id !== game.hostId) throw new Error("Alleen de host kan het potje stoppen.");
    game.status = "cancelled";
    game.turnPlayerId = null;
    game.waitingForResponses = [];
    game.message = `${actor.name} heeft het potje gestopt`;
    return;
  }
  if (type === "ready") {
    actor.ready = !actor.ready;
    game.message = actor.ready ? `${actor.name} is klaar` : `${actor.name} wacht nog even`;
    return;
  }
  if (type === "start") {
    if (actor.id !== game.hostId) throw new Error("Alleen de host kan starten.");
    if (game.players.length < 2) throw new Error("Er zijn minimaal 2 spelers nodig.");
    if (!game.players.every((p) => p.ready)) throw new Error("Nog niet iedereen is klaar.");
    game.status = "playing";
    dealRound(game);
    return;
  }
  if (type === "discard") {
    if (game.status !== "discarding") throw new Error("Er hoeven nu geen kaarten weg.");
    if (!game.discardingPlayerIds.includes(actor.id)) throw new Error("Jij hebt al kaarten weggegooid.");
    const cardIds = Array.isArray(payload.cardIds) ? payload.cardIds.filter((id): id is string => typeof id === "string") : [];
    if (cardIds.length !== 3 || new Set(cardIds).size !== 3) throw new Error("Kies precies 3 kaarten.");
    if (!cardIds.every((id) => actor.hand.some((card) => card.id === id))) throw new Error("Je kunt alleen kaarten uit je hand weggooien.");
    actor.hand = actor.hand.filter((card) => !cardIds.includes(card.id));
    game.discardingPlayerIds = game.discardingPlayerIds.filter((id) => id !== actor.id);
    game.message = `${actor.name} heeft 3 kaarten weggegooid`;
    if (!game.discardingPlayerIds.length) {
      game.status = "playing";
      game.turnPlayerId = game.leadPlayerId;
      const leader = game.players.find((player) => player.id === game.leadPlayerId);
      game.message = `${leader?.name ?? "De winnaar van de dobbelsteen"} mag uitkomen`;
    }
    return;
  }
  if (game.status !== "playing") throw new Error("Het potje is niet actief.");
  if (type === "play") {
    if (game.waitingForResponses.length) throw new Error("Wacht eerst op de Toep-reacties.");
    if (game.turnPlayerId !== actor.id) throw new Error("Jij bent niet aan de beurt.");
    const card = actor.hand.find((item) => item.id === payload.cardId);
    if (!card) throw new Error("Deze kaart zit niet in je hand.");
    const allowed = legalCards(actor.hand, game.trickCards[0]?.card.suit);
    if (!allowed.some((item) => item.id === card.id)) throw new Error("Je moet kleur bekennen.");
    actor.hand = actor.hand.filter((item) => item.id !== card.id);
    game.trickCards.push({ playerId: actor.id, card });
    const participants = game.players.filter((p) => p.active && !p.folded);
    if (game.trickCards.length < participants.length) {
      const next = nextActive(game, actor.id);
      game.turnPlayerId = next.id;
      game.message = `${next.name} is aan zet`;
      return;
    }
    const winnerId = trickWinner(game.trickCards);
    const winningPlay = game.trickCards.find((play) => play.playerId === winnerId)!;
    game.lastTrick = game.trickCards;
    game.completedTricks.push(game.trickCards);
    game.trickCards = [];
    if (game.trick === tricksPerRound(game)) {
      finishRound(game, winnerId, winningPlay.card);
    } else {
      game.trick += 1;
      game.leadPlayerId = winnerId;
      game.turnPlayerId = winnerId;
      game.message = `${game.players.find((p) => p.id === winnerId)!.name} won de slag`;
    }
    return;
  }
  if (type === "toep") {
    if (game.mode === "finale") throw new Error("Koningstoep speelt al direct om de winst.");
    if (!actor.active || actor.folded) throw new Error("Je kunt niet toepen als je niet meer meedoet in deze ronde.");
    if (game.lastToepCallerId === actor.id) throw new Error("Je kunt niet over jezelf heen toepen.");
    if (game.toepCallerId) throw new Error("Er loopt al een Toep.");
    game.roundValue += 1;
    game.toepCallerId = actor.id;
    game.lastToepCallerId = actor.id;
    game.waitingForResponses = toepResponseQueue(game, actor.id);
    game.message = `${actor.name} heeft getoept`;
    return;
  }
  if (type === "respond") {
    if (game.waitingForResponses[0] !== actor.id) throw new Error("Jij bent nog niet aan de beurt om te reageren.");
    game.waitingForResponses = game.waitingForResponses.filter((id) => id !== actor.id);
    if (payload.choice === "fold") {
      actor.folded = true;
      actor.score += Math.max(1, game.roundValue - 1);
      game.toepResponses.push({ playerId: actor.id, choice: "fold", round: game.round, roundValue: game.roundValue });
      game.message = `${actor.name} past`;
    } else {
      game.toepResponses.push({ playerId: actor.id, choice: "stay", round: game.round, roundValue: game.roundValue });
      game.message = `${actor.name} gaat mee`;
    }
    if (!game.waitingForResponses.length) {
      game.toepCallerId = null;
      const player = game.players.find((item) => item.id === game.turnPlayerId);
      game.message = `${player?.name ?? "De speler die aan zet was"} is weer aan zet`;
    }
    return;
  }
  if (type === "laundry") {
    if (!game.laundryEnabled || actor.usedLaundry || !hasDirtyLaundry(actor)) throw new Error("Vuile was is nu niet mogelijk.");
    const used = new Set(game.players.flatMap((p) => p.hand.map((card) => card.id)));
    actor.hand = shuffle(makeDeck().filter((card) => !used.has(card.id))).slice(0, 4);
    actor.usedLaundry = true;
    game.message = `${actor.name} opent de vuile was`;
    return;
  }
  throw new Error("Onbekende actie.");
}
