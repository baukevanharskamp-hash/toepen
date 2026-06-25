"use client";

import { QRCodeSVG } from "qrcode.react";
import { PublicGame } from "@/lib/types";
import { Button, Logo } from "./ui";

export function Lobby({ game, act }: { game: PublicGame; act: (type: string) => Promise<void> }) {
  const me = game.me!;
  const isHost = me.id === game.hostId;
  const joinUrl = typeof window === "undefined" ? "" : `${window.location.origin}/?spel=${game.code}`;
  const modeLabel = game.mode === "quick" ? "Snel potje tot 5" : game.mode === "finale" ? "Finale: Koningstoep" : "Normaal tot 15";

  async function share() {
    const text = `Doe mee met ons potje Toepen. Code: ${game.code}`;
    if (navigator.share) await navigator.share({ title: "Toep Samen", text, url: joinUrl });
    else await navigator.clipboard.writeText(`${text} ${joinUrl}`);
  }

  return (
    <main className="mx-auto min-h-dvh max-w-md px-5 pb-8 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <Logo small />
      <section className="mt-8 rounded-[28px] border border-white/10 bg-white/[.045] p-5">
        <div className="flex items-center justify-between">
          <div><div className="text-[10px] font-black uppercase tracking-[.2em] text-cream/35">Spelcode</div><div className="mt-1 text-4xl font-black tracking-[.16em] text-lime">{game.code}</div></div>
          <div className="rounded-2xl bg-cream p-2"><QRCodeSVG value={joinUrl} size={72} bgColor="#f6efd9" fgColor="#11130f" /></div>
        </div>
        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[.04] p-3">
          <div className="text-[10px] font-black uppercase tracking-[.18em] text-cream/35">Speltype</div>
          <div className="mt-1 text-sm font-black">{modeLabel}</div>
          {game.mode === "finale" && <div className="mt-1 text-xs font-bold text-amber/75">11 kaarten, 3 weggooien, dobbelsteen bepaalt wie begint.</div>}
        </div>
        <Button variant="ghost" className="mt-4 min-h-12 w-full" onClick={share}>Deel uitnodiging</Button>
      </section>
      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-black">Aan tafel</h2>
          <span className="text-xs font-bold text-cream/35">{game.players.length} / {game.maxPlayers}</span>
        </div>
        <div className="grid gap-2">
          {game.players.map((player) => (
            <div key={player.id} className="flex h-16 items-center gap-3 rounded-2xl border border-white/10 bg-white/[.035] px-4">
              <span className="text-2xl">{player.avatar}</span>
              <div className="min-w-0 flex-1"><div className="truncate font-black">{player.name}</div><div className="text-[10px] font-bold uppercase tracking-wider text-cream/30">{player.id === game.hostId ? "Host" : "Speler"}</div></div>
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${player.ready ? "bg-lime/15 text-lime" : "bg-white/5 text-cream/30"}`}>{player.ready ? "Klaar" : "Wacht"}</span>
            </div>
          ))}
          {Array.from({ length: game.maxPlayers - game.players.length }).map((_, index) => (
            <div key={index} className="grid h-16 place-items-center rounded-2xl border border-dashed border-white/10 text-xs font-bold text-cream/20">Vrije stoel</div>
          ))}
        </div>
      </section>
      {game.task && (
        <section className="my-6 rounded-2xl border border-amber/20 bg-amber/[.07] p-4">
          <div className="text-[10px] font-black uppercase tracking-[.18em] text-amber">{game.mode === "finale" ? "Inzet" : "Opdracht voor de verliezer"}</div>
          <div className="mt-2 text-lg font-black leading-snug">“{game.task}”</div>
        </section>
      )}
      <div className="sticky bottom-4 grid gap-2">
        <Button variant={me.ready ? "ghost" : "primary"} onClick={() => act("ready")}>{me.ready ? "Toch niet klaar" : "Ik ben klaar"}</Button>
        {isHost && <Button variant="secondary" disabled={game.players.length < 2 || !game.players.every((player) => player.ready)} onClick={() => act("start")}>Potje starten</Button>}
        {!isHost && <p className="text-center text-xs font-bold text-cream/30">De host start zodra iedereen klaar is.</p>}
      </div>
    </main>
  );
}
