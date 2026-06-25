"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { hasDirtyLaundry } from "@/lib/game";
import { Card, PublicGame } from "@/lib/types";
import { Button, PlayingCard, Scoreboard, TinyCardBacks } from "./ui";

export function GameTable({
  game, act, onStop, soundVolume, setSoundVolume,
}: {
  game: PublicGame;
  act: (type: string, payload?: Record<string, unknown>) => Promise<void>;
  onStop: () => void;
  soundVolume: number;
  setSoundVolume: (value: number) => void;
}) {
  const me = game.me!;
  const myTurn = game.turnPlayerId === me.id;
  const mustRespond = game.waitingForResponses.includes(me.id);
  const isDiscarding = game.status === "discarding";
  const isFinale = game.mode === "finale";
  const tricksThisRound = isFinale ? 8 : 4;
  const canLaundry = game.status === "playing" && game.laundryEnabled && !me.usedLaundry && hasDirtyLaundry({ ...me, token: "" });
  const [handOrder, setHandOrder] = useState<string[]>([]);
  const [discardIds, setDiscardIds] = useState<string[]>([]);
  const [draggingCardId, setDraggingCardId] = useState<string | null>(null);
  const [dropArmed, setDropArmed] = useState(false);
  const [confirmStop, setConfirmStop] = useState(false);
  const dragStart = useRef<{ x: number; y: number; id: string } | null>(null);
  const suppressNextClick = useRef(false);
  const playedCards = [...(game.completedTricks ?? []).flat(), ...game.trickCards];
  const playedByPlayer = new Map(game.players.map((player) => [
    player.id,
    playedCards.filter((play) => play.playerId === player.id),
  ]));
  const tablePlayers = [
    ...game.players.filter((player) => player.id !== me.id),
    game.players.find((player) => player.id === me.id)!,
  ];
  const orderedHand = useMemo(() => {
    const byId = new Map(me.hand.map((card) => [card.id, card]));
    return [
      ...handOrder.map((id) => byId.get(id)).filter(Boolean),
      ...me.hand.filter((card) => !handOrder.includes(card.id)),
    ] as Card[];
  }, [handOrder, me.hand]);

  useEffect(() => {
    setHandOrder((current) => [
      ...current.filter((id) => me.hand.some((card) => card.id === id)),
      ...me.hand.map((card) => card.id).filter((id) => !current.includes(id)),
    ]);
  }, [me.hand]);

  useEffect(() => {
    setDiscardIds((current) => current.filter((id) => me.hand.some((card) => card.id === id)));
  }, [me.hand]);

  function reorder(cardId: string, targetId: string) {
    if (cardId === targetId) return;
    setHandOrder((current) => {
      const next = current.filter((id) => id !== cardId);
      const targetIndex = next.indexOf(targetId);
      next.splice(targetIndex < 0 ? next.length : targetIndex, 0, cardId);
      return next;
    });
  }

  async function finishDrag(clientY: number, card: Card) {
    const legal = game.status === "playing" && myTurn && game.legalCardIds.includes(card.id) && !game.waitingForResponses.length;
    if (dropArmed && legal) {
      suppressNextClick.current = true;
      await act("play", { cardId: card.id });
    }
    setDropArmed(false);
    setDraggingCardId(null);
    dragStart.current = null;
  }

  function toggleDiscard(cardId: string) {
    setDiscardIds((current) => {
      if (current.includes(cardId)) return current.filter((id) => id !== cardId);
      if (current.length >= 3) return current;
      return [...current, cardId];
    });
  }

  return (
    <main className="felt mx-auto flex min-h-dvh max-w-md flex-col overflow-hidden border-x border-white/5">
      <header className="relative z-10 bg-ink/85 px-3 pb-3 pt-[max(.75rem,env(safe-area-inset-top))] backdrop-blur-xl">
        <div className="mb-2 flex items-center justify-between px-1">
          <div className="text-xs font-black tracking-widest">TOEP <span className="text-lime">SAMEN</span></div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-cream/35">
            <span>{isFinale ? "Koningstoep" : `Ronde ${game.round}`}</span><span className="h-1 w-1 rounded-full bg-cream/20"/><span>Slag {game.trick}/{tricksThisRound}</span>
          </div>
        </div>
        <Scoreboard game={game} />
        <div className="mt-2 flex justify-end">
          {me.id === game.hostId && (
            <button onClick={() => setConfirmStop(true)}
              className="rounded-full border border-[#e86c5d]/30 bg-[#e86c5d]/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#ff9d91]">
              Spel stoppen
            </button>
          )}
        </div>
      </header>

      <section className="relative flex min-h-0 flex-1 flex-col px-3 py-3">
        <div className="flex items-center justify-between">
          <div className={`rounded-full border px-3 py-2 text-xs font-black ${myTurn ? "pulse-turn border-lime/50 bg-lime/10 text-lime" : "border-white/10 bg-black/15 text-cream/65"}`}>
            {isDiscarding && game.discardingPlayerIds.includes(me.id) ? "Kies 3 kaarten om weg te gooien" : myTurn ? "Jij bent aan de beurt" : game.message}
          </div>
          <div className="rounded-full border border-amber/30 bg-amber/10 px-3 py-2 text-xs font-black text-amber">{isFinale ? "Om de winst" : `Waarde ×${game.roundValue}`}</div>
        </div>

        <div className="mt-3 flex justify-center gap-5">
          {game.players.filter((player) => player.id !== me.id).map((player) => (
            <div key={player.id} className={`flex flex-col items-center gap-1 ${player.folded ? "opacity-25" : ""}`}>
              <div className={`grid h-10 w-10 place-items-center rounded-full border text-lg ${game.turnPlayerId === player.id ? "border-lime bg-lime/10" : "border-white/10 bg-black/20"}`}>{player.avatar}</div>
              <span className="max-w-20 truncate text-[10px] font-black">{player.name}</span>
              <TinyCardBacks count={player.cardCount} />
            </div>
          ))}
        </div>

        <div className="relative my-3 flex min-h-[220px] flex-1 items-center justify-center">
          <div className={`absolute h-44 w-72 rounded-[50%] border bg-black/[.07] shadow-inner transition ${
            dropArmed ? "border-lime/80 shadow-[0_0_44px_rgba(201,241,74,.24)]" : "border-white/[.08]"
          }`} />
          {dropArmed && (
            <div className="absolute grid h-16 w-16 place-items-center rounded-full border-2 border-lime bg-lime/20 text-4xl font-black text-lime shadow-[0_0_30px_rgba(201,241,74,.22)]">
              +
            </div>
          )}
          {playedCards.length === 0 ? (
            <div className="relative text-center">
              <div className="text-3xl opacity-20">♣</div>
              <div className="mt-2 text-[10px] font-black uppercase tracking-[.22em] text-cream/25">De tafel wacht</div>
            </div>
          ) : (
            <div className="relative grid w-full grid-cols-2 gap-3 px-1 py-2">
              {tablePlayers.map((player) => {
                const stack = playedByPlayer.get(player.id) ?? [];
                const isMe = player.id === me.id;
                const isTurn = game.turnPlayerId === player.id;
                return (
                  <div key={player.id}
                    className={`relative min-h-[106px] rounded-[24px] border bg-black/[.10] p-2 transition ${
                      isMe ? "col-span-2 mx-auto w-[72%]" : ""
                    } ${
                      isTurn ? "border-lime/35 shadow-[0_0_0_1px_rgba(201,241,74,.08)]" : "border-white/[.07]"
                    }`}>
                    <div className={`mb-1 flex items-center justify-center gap-1.5 text-[9px] font-black uppercase tracking-[.14em] ${isTurn ? "text-lime" : "text-cream/38"}`}>
                      <span>{player.avatar}</span>
                      <span className="max-w-20 truncate">{isMe ? "Jij" : player.name}</span>
                    </div>
                    <div className="flex min-h-[76px] items-center justify-center -space-x-7">
                      {stack.length ? stack.map((play, index) => (
                        <div key={`${play.playerId}-${play.card.id}`} className="relative scale-[.82]"
                          style={{ transform: `rotate(${(index - (stack.length - 1) / 2) * 7}deg) translateY(${index % 2 ? 4 : 0}px)` }}>
                          <PlayingCard card={play.card} compact />
                          {game.trickCards.some((current) => current.playerId === play.playerId && current.card.id === play.card.id) && (
                            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-lime px-2 py-0.5 text-[7px] font-black uppercase text-ink">
                              Nu
                            </span>
                          )}
                        </div>
                      )) : (
                        <div className="grid h-[62px] w-[52px] place-items-center rounded-xl border border-dashed border-white/10 text-[9px] font-black uppercase tracking-wider text-cream/20">
                          Nog niets
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="wood-tray relative rounded-t-[28px] border border-amber/30 px-3 pb-[calc(.65rem+var(--safe-bottom))] pt-3 shadow-[0_-18px_38px_rgba(0,0,0,.24)]">
          <div className="mb-2 flex items-end justify-between px-1">
            <div><div className="text-[10px] font-black uppercase tracking-wider text-cream/70">Jouw hand</div><div className="text-xs font-bold text-cream/80">{isDiscarding ? `${discardIds.length}/3 gekozen` : myTurn ? "Tik een kaart om te spelen" : "Niet op tafel, nog in je hand"}</div></div>
            <div className="flex items-center gap-2">
              {canLaundry && <button onClick={() => act("laundry")} className="rounded-full bg-amber px-3 py-2 text-[10px] font-black text-ink">Vuile was openen</button>}
              <button onClick={() => setSoundVolume(soundVolume > 0 ? 0 : 0.75)} className="rounded-full border border-white/20 bg-black/15 px-3 py-2 text-[10px] font-black text-cream">
                {soundVolume > 0 ? "Geluid" : "Stil"}
              </button>
            </div>
          </div>
          {isDiscarding && (
            <div className="mb-2 rounded-2xl border border-lime/25 bg-lime/10 p-3">
              <div className="text-[10px] font-black uppercase tracking-[.2em] text-lime">Koningstoep voorbereiding</div>
              <div className="mt-1 text-sm font-bold text-cream/80">
                Iedereen kreeg 11 kaarten. Gooi er 3 weg; daarna begint de winnaar van de dobbelsteen.
              </div>
              {!!game.starterRolls.length && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {game.starterRolls.map((roll, index) => {
                    const player = game.players.find((item) => item.id === roll.playerId);
                    return <span key={`${roll.playerId}-${index}`} className="rounded-full bg-black/20 px-2 py-1 text-[10px] font-black text-cream/60">{player?.name}: ⚂ {roll.roll}</span>;
                  })}
                </div>
              )}
              {game.discardingPlayerIds.includes(me.id) ? (
                <Button className="mt-3 min-h-11 w-full" disabled={discardIds.length !== 3} onClick={() => act("discard", { cardIds: discardIds })}>
                  3 kaarten weggooien
                </Button>
              ) : (
                <div className="mt-3 rounded-xl bg-black/15 p-3 text-xs font-bold text-cream/55">Jij bent klaar. Wachten op de ander.</div>
              )}
            </div>
          )}
          {mustRespond && (
            <div className="mb-2 rounded-2xl border border-amber/35 bg-amber/15 p-3">
              <div className="text-[10px] font-black uppercase tracking-[.2em] text-amber">Er is getoept</div>
              <div className="mt-1 text-sm font-bold text-cream/80">Bekijk rustig je kaarten en kies: meegaan of passen.</div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button variant="ghost" className="min-h-11" onClick={() => act("respond", { choice: "fold" })}>Passen</Button>
                <Button className="min-h-11" onClick={() => act("respond", { choice: "stay" })}>Meegaan</Button>
              </div>
            </div>
          )}
          <label className="mb-2 flex items-center gap-2 px-1 text-[10px] font-black uppercase tracking-wider text-cream/55">
            Volume
            <input type="range" min="0" max="1" step="0.05" value={soundVolume}
              onChange={(event) => setSoundVolume(Number(event.target.value))}
              className="h-1 flex-1 accent-lime" />
          </label>
          <div className="rounded-[22px] border border-black/25 bg-black/15 px-2 py-3 shadow-inner">
            <div className="flex min-h-[132px] items-end justify-center -space-x-2 overflow-visible">
              {orderedHand.map((card, index) => {
                const selectedForDiscard = discardIds.includes(card.id);
                const disabled = !isDiscarding && (!myTurn || !game.legalCardIds.includes(card.id) || !!game.waitingForResponses.length);
                return (
                  <div key={card.id}
                    draggable
                    onDragStart={(event) => {
                      setDraggingCardId(card.id);
                      dragStart.current = { x: event.clientX, y: event.clientY, id: card.id };
                    }}
                    onDragEnter={() => draggingCardId && reorder(draggingCardId, card.id)}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setDropArmed(Boolean(draggingCardId && dragStart.current && dragStart.current.y - event.clientY > 86));
                    }}
                    onDragEnd={(event) => void finishDrag(event.clientY, card)}
                    onPointerDown={(event) => {
                      setDraggingCardId(card.id);
                      dragStart.current = { x: event.clientX, y: event.clientY, id: card.id };
                    }}
                    onPointerMove={(event) => {
                      if (dragStart.current?.id !== card.id) return;
                      setDropArmed(dragStart.current.y - event.clientY > 86);
                    }}
                    onPointerUp={(event) => void finishDrag(event.clientY, card)}
                    className={`${draggingCardId === card.id ? "z-20 scale-105" : "z-10"} ${selectedForDiscard ? "rounded-xl ring-4 ring-[#e86c5d]" : ""} touch-none transition`}>
                    <PlayingCard card={card} delay={index * 55}
                      disabled={disabled}
                      onClick={() => {
                        if (isDiscarding) {
                          toggleDiscard(card.id);
                          return;
                        }
                        if (suppressNextClick.current) {
                          suppressNextClick.current = false;
                          return;
                        }
                        void act("play", { cardId: card.id });
                      }} />
                  </div>
                );
              })}
              {!me.hand.length && (
                <div className="grid h-24 place-items-center text-center text-xs font-black uppercase tracking-[.18em] text-cream/45">
                  Alle kaarten gespeeld
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {!isFinale && !mustRespond && !game.waitingForResponses.length && game.status === "playing" && (
        <button onClick={() => act("toep")} className="fixed bottom-[calc(184px+var(--safe-bottom))] right-[max(1rem,calc((100vw-28rem)/2+1rem))] z-20 grid h-14 w-14 rotate-3 place-items-center rounded-full border-4 border-ink bg-amber text-sm font-black text-ink shadow-xl active:scale-95">
          TOEP
        </button>
      )}

      {confirmStop && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/65 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[28px] border border-white/10 bg-ink p-5 shadow-2xl">
            <div className="text-xs font-black uppercase tracking-[.2em] text-[#ff9d91]">Weet je het zeker?</div>
            <h2 className="mt-2 text-3xl font-black">Potje stoppen</h2>
            <p className="mt-2 text-sm leading-6 text-cream/55">
              Dit stopt het potje voor iedereen. Alle spelers gaan terug naar het beginscherm en kunnen daarna een nieuw potje starten.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <Button variant="ghost" onClick={() => setConfirmStop(false)}>Annuleren</Button>
              <Button variant="danger" onClick={() => {
                setConfirmStop(false);
                void act("stop").then(onStop);
              }}>Ja, stoppen</Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
