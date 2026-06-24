"use client";

import { hasDirtyLaundry } from "@/lib/game";
import { PublicGame } from "@/lib/types";
import { Button, PlayingCard, Scoreboard, TinyCardBacks } from "./ui";

export function GameTable({ game, act }: { game: PublicGame; act: (type: string, payload?: Record<string, unknown>) => Promise<void> }) {
  const me = game.me!;
  const myTurn = game.turnPlayerId === me.id;
  const mustRespond = game.waitingForResponses.includes(me.id);
  const canLaundry = game.laundryEnabled && !me.usedLaundry && hasDirtyLaundry({ ...me, token: "" });
  const playedCards = [...(game.completedTricks ?? []).flat(), ...game.trickCards];
  const playedByPlayer = new Map(game.players.map((player) => [
    player.id,
    playedCards.filter((play) => play.playerId === player.id),
  ]));
  const tablePlayers = [
    ...game.players.filter((player) => player.id !== me.id),
    game.players.find((player) => player.id === me.id)!,
  ];

  return (
    <main className="felt mx-auto flex min-h-dvh max-w-md flex-col overflow-hidden border-x border-white/5">
      <header className="relative z-10 bg-ink/85 px-3 pb-3 pt-[max(.75rem,env(safe-area-inset-top))] backdrop-blur-xl">
        <div className="mb-2 flex items-center justify-between px-1">
          <div className="text-xs font-black tracking-widest">TOEP <span className="text-lime">SAMEN</span></div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-cream/35">
            <span>Ronde {game.round}</span><span className="h-1 w-1 rounded-full bg-cream/20"/><span>Slag {game.trick}/4</span>
          </div>
        </div>
        <Scoreboard game={game} />
      </header>

      <section className="relative flex min-h-0 flex-1 flex-col px-3 py-3">
        <div className="flex items-center justify-between">
          <div className={`rounded-full border px-3 py-2 text-xs font-black ${myTurn ? "pulse-turn border-lime/50 bg-lime/10 text-lime" : "border-white/10 bg-black/15 text-cream/65"}`}>
            {myTurn ? "Jij bent aan de beurt" : game.message}
          </div>
          <div className="rounded-full border border-amber/30 bg-amber/10 px-3 py-2 text-xs font-black text-amber">Waarde ×{game.roundValue}</div>
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
          <div className="absolute h-44 w-72 rounded-[50%] border border-white/[.08] bg-black/[.07] shadow-inner" />
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
            <div><div className="text-[10px] font-black uppercase tracking-wider text-cream/70">Jouw hand</div><div className="text-xs font-bold text-cream/80">{myTurn ? "Tik een kaart om te spelen" : "Niet op tafel, nog in je hand"}</div></div>
            {canLaundry && <button onClick={() => act("laundry")} className="rounded-full bg-amber px-3 py-2 text-[10px] font-black text-ink">Vuile was openen</button>}
          </div>
          <div className="rounded-[22px] border border-black/25 bg-black/15 px-2 py-3 shadow-inner">
            <div className="flex min-h-[132px] items-end justify-center -space-x-2 overflow-visible">
              {me.hand.map((card, index) => (
                <PlayingCard key={card.id} card={card} delay={index * 55}
                  disabled={!myTurn || !game.legalCardIds.includes(card.id) || !!game.waitingForResponses.length}
                  onClick={() => act("play", { cardId: card.id })} />
              ))}
              {!me.hand.length && (
                <div className="grid h-24 place-items-center text-center text-xs font-black uppercase tracking-[.18em] text-cream/45">
                  Alle kaarten gespeeld
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {mustRespond && (
        <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/65 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[28px] border border-white/10 bg-ink p-5 shadow-2xl">
            <div className="text-xs font-black uppercase tracking-[.2em] text-amber">Er is getoept</div>
            <h2 className="mt-2 text-3xl font-black">Ga je mee?</h2>
            <p className="mt-2 text-sm leading-6 text-cream/50">De ronde is nu {game.roundValue} punten waard. Passen kost je {Math.max(1, game.roundValue - 1)}.</p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <Button variant="ghost" onClick={() => act("respond", { choice: "fold" })}>Passen</Button>
              <Button onClick={() => act("respond", { choice: "stay" })}>Meegaan</Button>
            </div>
          </div>
        </div>
      )}

      {!mustRespond && !game.waitingForResponses.length && game.status === "playing" && (
        <button onClick={() => act("toep")} className="fixed bottom-[calc(184px+var(--safe-bottom))] right-[max(1rem,calc((100vw-28rem)/2+1rem))] z-20 grid h-14 w-14 rotate-3 place-items-center rounded-full border-4 border-ink bg-amber text-sm font-black text-ink shadow-xl active:scale-95">
          TOEP
        </button>
      )}
    </main>
  );
}
