export const SUITS = ["harten", "ruiten", "klaveren", "schoppen"] as const;
export const RANKS = ["7", "8", "9", "10", "B", "V", "H", "A"] as const;
export type Suit = (typeof SUITS)[number];
export type Rank = (typeof RANKS)[number];

export type Card = { id: string; suit: Suit; rank: Rank };
export type Player = {
  id: string;
  token: string;
  name: string;
  avatar: string;
  score: number;
  ready: boolean;
  active: boolean;
  folded: boolean;
  hand: Card[];
  usedLaundry: boolean;
};
export type PlayedCard = { playerId: string; card: Card };
export type GameStatus = "lobby" | "playing" | "finished" | "cancelled";
export type Game = {
  code: string;
  createdAt: number;
  status: GameStatus;
  hostId: string;
  maxPlayers: 2 | 3 | 4;
  task: string;
  stopAtFirstLoser: boolean;
  laundryEnabled: boolean;
  jackBonusEnabled: boolean;
  players: Player[];
  round: number;
  roundValue: number;
  trick: number;
  dealerIndex: number;
  turnPlayerId: string | null;
  leadPlayerId: string | null;
  trickCards: PlayedCard[];
  completedTricks: PlayedCard[][];
  lastTrick: PlayedCard[];
  waitingForResponses: string[];
  toepCallerId: string | null;
  message: string;
  loserId: string | null;
};

export type PublicPlayer = Omit<Player, "token" | "hand"> & { cardCount: number };
export type PublicGame = Omit<Game, "players"> & {
  players: PublicPlayer[];
  me: Omit<Player, "token"> | null;
  legalCardIds: string[];
};
