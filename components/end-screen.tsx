"use client";

import { PublicGame } from "@/lib/types";
import { Button, Logo } from "./ui";

export function EndScreen({ game, goHome }: { game: PublicGame; goHome: () => void }) {
  const loser = game.players.find((player) => player.id === game.loserId);
  const winner = game.players.find((player) => player.id === game.finalWinnerId);
  const isFinale = game.mode === "finale";
  async function share() {
    const text = isFinale
      ? `${winner?.name} won de Koningstoep${game.task ? `. Inzet: ${game.task}` : "."}`
      : `${loser?.name} verloor ons potje Toepen met ${loser?.score} punten. Opdracht: ${game.task}`;
    if (navigator.share) await navigator.share({ title: "Uitslag Toep Samen", text });
    else await navigator.clipboard.writeText(text);
  }
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-8 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <Logo small />
      <section className="flex flex-1 flex-col justify-center py-10 text-center">
        <div className={`mx-auto grid h-24 w-24 place-items-center rounded-full border text-5xl ${isFinale ? "border-lime/30 bg-lime/10" : "border-[#e86c5d]/30 bg-[#e86c5d]/10"}`}>{isFinale ? winner?.avatar : loser?.avatar}</div>
        <div className={`mt-6 text-xs font-black uppercase tracking-[.24em] ${isFinale ? "text-lime" : "text-[#ff8d80]"}`}>{isFinale ? "Koningstoep gewonnen" : "We hebben een verliezer"}</div>
        <h1 className="mt-2 text-5xl font-black leading-none tracking-tight">{isFinale ? winner?.name : loser?.name}<br/><span className="text-cream/30">{isFinale ? "wint." : "is af."}</span></h1>
        {game.task && (
          <div className="mt-8 rounded-[28px] border border-amber/25 bg-amber/[.08] p-6">
            <div className="text-[10px] font-black uppercase tracking-[.2em] text-amber">{isFinale ? "Inzet" : "Opdracht uitvoeren"}</div>
            <div className="mt-3 text-2xl font-black leading-tight">“{game.task}”</div>
          </div>
        )}
        <div className="mt-6 grid grid-cols-2 gap-2">
          {game.players.map((player) => (
            <div key={player.id} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[.04] p-3 text-left">
              <span>{player.avatar}</span><span className="min-w-0 flex-1 truncate text-xs font-black">{player.name}</span><span className="text-xl font-black">{player.score}</span>
            </div>
          ))}
        </div>
      </section>
      <div className="grid gap-2">
        <Button onClick={share}>Score delen</Button>
        <Button variant="ghost" onClick={goHome}>Terug naar home</Button>
      </div>
    </main>
  );
}
