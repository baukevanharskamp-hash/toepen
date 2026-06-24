import { Card, Game, Player, PublicGame, RANKS, Rank, SUITS } from "./types";

const strength: Record<Rank, number> = {
  B: 0, V: 1, H: 2, A: 3, "7": 4, "8": 5, "9": 6, "10": 7,
};

export function makeDeck(): Card[] {
  return SUITS.flatMap((suit) => RANKS.map((rank) => ({ id: `${suit}-${rank}`, suit, rank })));
}

export function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function legalCards(hand: Card[], leadSuit?: Card["suit"]): Card[] {
  if (!leadSuit) return hand;
  const following = hand.filter((card) => card.suit === leadSuit);
  return following.length ? following : hand;
}

export function trickWinner(cards: { playerId: string; card: Card }[]): string {
  if (!cards.length) throw new Error("Een lege slag heeft geen winnaar.");
  const leadSuit = cards[0].card.suit;
  return cards
    .filter(({ card }) => card.suit === leadSuit)
    .reduce((best, current) => strength[current.card.rank] > strength[best.card.rank] ? current : best)
    .playerId;
}

export function hasDirtyLaundry(player: Player): boolean {
  return player.hand.length === 4 && player.hand.every((card) => ["B", "V", "H", "A"].includes(card.rank));
}

export function publicGame(game: Game, token?: string): PublicGame {
  const me = game.players.find((player) => player.token === token) ?? null;
  const leadSuit = game.trickCards[0]?.card.suit;
  return {
    ...game,
    players: game.players.map(({ token: _token, hand, ...player }) => ({ ...player, cardCount: hand.length })),
    me: me ? (({ token: _token, ...player }) => player)(me) : null,
    legalCardIds: me && game.turnPlayerId === me.id
      ? legalCards(me.hand, leadSuit).map((card) => card.id)
      : [],
  };
}

export function nextActive(game: Game, fromId: string): Player {
  const start = game.players.findIndex((player) => player.id === fromId);
  for (let step = 1; step <= game.players.length; step++) {
    const candidate = game.players[(start + step) % game.players.length];
    if (candidate.active && !candidate.folded && candidate.hand.length > 0) return candidate;
  }
  throw new Error("Geen actieve speler gevonden.");
}

export function dealRound(game: Game): void {
  const deck = shuffle(makeDeck());
  game.players.forEach((player, index) => {
    player.hand = player.active ? deck.slice(index * 4, index * 4 + 4) : [];
    player.folded = false;
    player.usedLaundry = false;
  });
  game.round += 1;
  game.roundValue = 1;
  game.trick = 1;
  game.trickCards = [];
  game.completedTricks = [];
  game.lastTrick = [];
  game.waitingForResponses = [];
  game.toepCallerId = null;
  const leader = game.players[(game.dealerIndex + 1) % game.players.length];
  game.leadPlayerId = leader.id;
  game.turnPlayerId = leader.id;
  game.message = `${leader.name} mag uitkomen`;
}

export function finishRound(game: Game, winnerId: string, winningCard: Card): void {
  const winner = game.players.find((player) => player.id === winnerId)!;
  for (const player of game.players) {
    if (player.active && !player.folded && player.id !== winnerId) player.score += game.roundValue;
  }
  if (game.jackBonusEnabled && winningCard.rank === "B") {
    winner.score = Math.max(0, winner.score - 1);
    game.message = `${winner.name} wint met een boer! -1 punt`;
  } else {
    game.message = `${winner.name} wint de ronde`;
  }
  const losers = game.players.filter((player) => player.active && player.score >= 15);
  if (losers.length) {
    losers.forEach((player) => { player.active = false; });
    game.loserId = losers[0].id;
    if (game.stopAtFirstLoser || game.players.filter((player) => player.active).length <= 1) {
      game.status = "finished";
      game.turnPlayerId = null;
      return;
    }
  }
  game.dealerIndex = (game.dealerIndex + 1) % game.players.length;
  dealRound(game);
}
