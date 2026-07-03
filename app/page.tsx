"use client";

import { useCallback, useEffect, useState } from "react";
import { EndScreen } from "@/components/end-screen";
import { GameTable } from "@/components/game-table";
import { Home } from "@/components/home";
import { Lobby } from "@/components/lobby";
import { playSound, unlockSound } from "@/lib/sounds";
import { PublicGame } from "@/lib/types";

export default function Page() {
  const [code, setCode] = useState("");
  const [token, setToken] = useState("");
  const [game, setGame] = useState<PublicGame | null>(null);
  const [error, setError] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [soundVolume, setSoundVolume] = useState(1);
  const [lastEventKey, setLastEventKey] = useState("");
  const initialCode = hydrated ? new URLSearchParams(window.location.search).get("spel") ?? "" : "";

  const load = useCallback(async (gameCode: string, playerToken: string) => {
    const response = await fetch(`/api/games/${gameCode}?token=${encodeURIComponent(playerToken)}`, { cache: "no-store" });
    if (!response.ok) {
      if (response.status === 404) return;
      throw new Error("Potje kon niet worden geladen.");
    }
    const data = await response.json();
    if (data.status === "cancelled") {
      localStorage.removeItem("toep-code");
      localStorage.removeItem("toep-token");
      window.history.replaceState({}, "", "/");
      setGame(null);
      setCode("");
      setToken("");
      setError("Het potje is gestopt.");
      return;
    }
    if (data.me) setGame(data);
  }, []);

  useEffect(() => {
    const urlCode = new URLSearchParams(window.location.search).get("spel") ?? "";
    const savedCode = localStorage.getItem("toep-code") ?? "";
    const savedToken = localStorage.getItem("toep-token") ?? "";
    const savedVolume = localStorage.getItem("toep-sound-volume");
    setHydrated(true);
    if (savedVolume !== null) setSoundVolume(Number(savedVolume));
    if (urlCode && urlCode !== savedCode) {
      localStorage.removeItem("toep-code");
      localStorage.removeItem("toep-token");
      setCode("");
      setToken("");
      setGame(null);
      return;
    }
    if (savedCode && savedToken) {
      setCode(savedCode); setToken(savedToken);
      load(savedCode, savedToken).catch(() => {});
    }
  }, [load]);

  useEffect(() => {
    function unlock() { unlockSound(); }
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("touchstart", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("touchstart", unlock);
    };
  }, []);

  useEffect(() => {
    if (!hydrated || !initialCode || !game || initialCode === game.code) return;
    localStorage.removeItem("toep-code");
    localStorage.removeItem("toep-token");
    setGame(null);
    setCode("");
    setToken("");
  }, [hydrated, initialCode, game]);

  useEffect(() => {
    if (!game?.me || game.status !== "playing") return;
    const currentCard = game.trickCards.at(-1);
    const currentResponse = game.toepResponses.at(-1);
    const eventKey = currentCard
      ? `card:${game.round}:${game.trick}:${currentCard.playerId}:${currentCard.card.id}`
      : currentResponse
        ? `respond:${currentResponse.round}:${currentResponse.roundValue}:${currentResponse.playerId}:${currentResponse.choice}`
      : game.toepCallerId
        ? `toep:${game.round}:${game.roundValue}:${game.toepCallerId}`
        : game.message.includes("wint de ronde") || game.message.includes("wint met een boer")
          ? `win:${game.round}:${game.message}`
          : "";
    if (!eventKey || eventKey === lastEventKey) return;
    setLastEventKey(eventKey);
    if (eventKey.startsWith("card:")) playSound("card", soundVolume);
    if (eventKey.startsWith("respond:")) playSound(currentResponse?.choice === "fold" ? "fold" : "stay", soundVolume);
    if (eventKey.startsWith("toep:")) playSound("toep", soundVolume);
    if (eventKey.startsWith("win:") && game.message.includes(game.me.name)) playSound("applause", soundVolume);
  }, [game, lastEventKey, soundVolume]);

  function updateSoundVolume(value: number) {
    setSoundVolume(value);
    localStorage.setItem("toep-sound-volume", String(value));
  }

  useEffect(() => {
    if (!code || !token || !game) return;
    const interval = window.setInterval(() => load(code, token).catch(() => {}), 900);
    return () => window.clearInterval(interval);
  }, [code, token, game, load]);

  function enter(gameCode: string, playerToken: string) {
    localStorage.setItem("toep-code", gameCode);
    localStorage.setItem("toep-token", playerToken);
    window.history.replaceState({}, "", `/?spel=${gameCode}`);
    setCode(gameCode); setToken(playerToken);
    load(gameCode, playerToken).catch((cause) => setError(cause.message));
  }

  async function act(type: string, payload?: Record<string, unknown>) {
    setError("");
    const response = await fetch(`/api/games/${code}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, token, payload }),
    });
    const data = await response.json();
    if (!response.ok) { setError(data.error); return; }
    if (data.status === "cancelled") {
      goHome();
      return;
    }
    setGame(data);
  }

  function goHome() {
    localStorage.removeItem("toep-code"); localStorage.removeItem("toep-token");
    window.history.replaceState({}, "", "/");
    setGame(null); setCode(""); setToken("");
  }

  if (!hydrated) return <div className="grid min-h-dvh place-items-center text-sm font-black text-lime">Kaarten schudden…</div>;
  if (!game) return <Home initialCode={initialCode} onEnter={enter} />;

  return (
    <>
      {game.status === "lobby" && <Lobby game={game} act={(type) => act(type)} onLeave={goHome} />}
      {(game.status === "playing" || game.status === "discarding") && <GameTable game={game} act={act} onStop={goHome} onLeave={goHome} soundVolume={soundVolume} setSoundVolume={updateSoundVolume} />}
      {game.status === "finished" && <EndScreen game={game} goHome={goHome} />}
      {error && <button onClick={() => setError("")} className="fixed left-1/2 top-[max(1rem,env(safe-area-inset-top))] z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-2xl border border-[#e86c5d]/30 bg-[#52251f] p-4 text-left text-sm font-bold shadow-2xl">{error}<span className="float-right opacity-50">×</span></button>}
    </>
  );
}
