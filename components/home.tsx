"use client";

import { useState } from "react";
import { AvatarPicker, Button, Field, Logo, avatars } from "./ui";

type View = "home" | "create" | "join";

export function Home({ initialCode, onEnter }: { initialCode?: string; onEnter: (code: string, token: string) => void }) {
  const [view, setView] = useState<View>(initialCode ? "join" : "home");
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(avatars[0]);
  const [code, setCode] = useState(initialCode ?? "");
  const [task, setTask] = useState("");
  const [maxPlayers, setMaxPlayers] = useState<2 | 3 | 4>(4);
  const [stopAtFirstLoser, setStopAtFirstLoser] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submitCreate(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/games", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, avatar, task, maxPlayers, stopAtFirstLoser }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      onEnter(data.code, data.token);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Dat ging niet goed."); }
    finally { setBusy(false); }
  }

  async function submitJoin(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const gameCode = code.trim().toUpperCase();
      const response = await fetch(`/api/games/${gameCode}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "join", name, avatar }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      onEnter(gameCode, data.token);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Dat ging niet goed."); }
    finally { setBusy(false); }
  }

  if (view === "home") return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-5 pb-8 pt-[max(2rem,env(safe-area-inset-top))]">
      <Logo />
      <section className="flex flex-1 flex-col justify-center py-12">
        <div className="mb-8">
          <div className="mb-5 inline-flex rounded-full border border-amber/20 bg-amber/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.2em] text-amber">
            De digitale kroegtafel
          </div>
          <h1 className="max-w-sm text-[52px] font-black leading-[.92] tracking-[-.055em]">
            Speel hard.<br/><span className="text-lime">Verlies mooi.</span>
          </h1>
          <p className="mt-5 max-w-xs text-[15px] font-medium leading-6 text-cream/55">
            Toepen met vrienden. Vier kaarten, vijftien punten en één opdracht die je liever niet uitvoert.
          </p>
        </div>
        <div className="grid gap-3">
          <Button onClick={() => setView("create")}>Nieuw potje starten <span className="ml-2">→</span></Button>
          <Button variant="ghost" onClick={() => setView("join")}>Meedoen met code</Button>
        </div>
      </section>
      <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[.16em] text-cream/25">
        <span>2–4 spelers</span><span>Live op elke telefoon</span>
      </div>
    </main>
  );

  const isCreate = view === "create";
  return (
    <main className="mx-auto min-h-dvh max-w-md px-5 pb-8 pt-[max(1.5rem,env(safe-area-inset-top))]">
      <button onClick={() => setView("home")} className="mb-7 rounded-full border border-white/10 px-3 py-2 text-xs font-bold text-cream/60">← Terug</button>
      <div className="mb-7">
        <div className="text-xs font-black uppercase tracking-[.18em] text-lime">{isCreate ? "Nieuwe tafel" : "Schuif aan"}</div>
        <h1 className="mt-2 text-4xl font-black tracking-tight">{isCreate ? "Wie deelt er?" : "Bijna aan tafel."}</h1>
      </div>
      <form onSubmit={isCreate ? submitCreate : submitJoin} className="grid gap-5">
        <label className="grid gap-2 text-xs font-black uppercase tracking-wider text-cream/50">
          Jouw naam
          <Field value={name} onChange={(event) => setName(event.target.value)} placeholder="Bijv. Bauke" maxLength={18} required autoFocus />
        </label>
        <label className="grid gap-2 text-xs font-black uppercase tracking-wider text-cream/50">
          Kies je kop
          <AvatarPicker value={avatar} onChange={setAvatar} />
        </label>
        {isCreate ? <>
          <label className="grid gap-2 text-xs font-black uppercase tracking-wider text-cream/50">
            Aantal spelers
            <div className="grid grid-cols-3 gap-2">
              {[2, 3, 4].map((amount) => <button type="button" key={amount} onClick={() => setMaxPlayers(amount as 2 | 3 | 4)}
                className={`h-14 rounded-2xl text-lg font-black ${maxPlayers === amount ? "bg-lime text-ink" : "bg-white/[.06]"}`}>{amount}</button>)}
            </div>
          </label>
          <label className="grid gap-2 text-xs font-black uppercase tracking-wider text-cream/50">
            Opdracht voor de verliezer
            <textarea value={task} onChange={(event) => setTask(event.target.value)} required maxLength={140}
              placeholder="Bijv. de volgende ronde drankjes halen"
              className="min-h-24 resize-none rounded-2xl border border-cream/10 bg-white/[.06] p-4 font-bold normal-case text-cream outline-none placeholder:text-cream/25 focus:border-lime/60" />
          </label>
          <button type="button" onClick={() => setStopAtFirstLoser(!stopAtFirstLoser)} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[.04] p-4 text-left">
            <div><div className="text-sm font-black">Stop bij eerste verliezer</div><div className="mt-1 text-xs text-cream/40">Of speel door tot één winnaar</div></div>
            <span className={`h-7 w-12 rounded-full p-1 transition ${stopAtFirstLoser ? "bg-lime" : "bg-white/10"}`}><span className={`block h-5 w-5 rounded-full bg-ink transition ${stopAtFirstLoser ? "translate-x-5" : ""}`} /></span>
          </button>
        </> : (
          <label className="grid gap-2 text-xs font-black uppercase tracking-wider text-cream/50">
            Spelcode
            <Field value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="TOEP" maxLength={4} required className="text-center text-2xl tracking-[.35em]" />
          </label>
        )}
        {error && <div className="rounded-xl border border-[#e86c5d]/30 bg-[#e86c5d]/10 p-3 text-sm font-bold text-[#ff9d91]">{error}</div>}
        <Button type="submit" disabled={busy}>{busy ? "Even schudden…" : isCreate ? "Tafel openen" : "Meedoen"}</Button>
      </form>
    </main>
  );
}
