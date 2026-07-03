"use client";

import { Card as CardType, PublicGame, PublicPlayer } from "@/lib/types";

export const avatars = ["🍺", "🃏", "🎯", "🍟", "🎱", "🎸", "⚡", "🥨"];
const isPhotoAvatar = (avatar: string) => avatar.startsWith("data:image/");

export function Logo({ small = false }: { small?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`${small ? "h-10 w-10 rounded-xl text-xl" : "h-14 w-14 rounded-2xl text-3xl"} grid -rotate-3 place-items-center border border-lime/30 bg-lime font-black text-ink shadow-card`}>
        T
      </div>
      <div>
        <div className={`${small ? "text-lg" : "text-2xl"} font-black tracking-tight`}>TOEP SAMEN</div>
        {!small && <div className="text-xs font-bold uppercase tracking-[.22em] text-cream/45">Vier kaarten. Eén opdracht.</div>}
      </div>
    </div>
  );
}

export function Button({
  children, onClick, disabled, variant = "primary", type = "button", className = "",
}: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean;
  variant?: "primary" | "secondary" | "ghost" | "danger"; type?: "button" | "submit"; className?: string;
}) {
  const styles = {
    primary: "bg-lime text-ink hover:bg-[#d8ff60] shadow-[0_8px_26px_rgba(201,241,74,.15)]",
    secondary: "bg-cream text-ink hover:bg-white",
    ghost: "border border-cream/15 bg-white/5 text-cream hover:bg-white/10",
    danger: "bg-[#e86c5d] text-white",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`min-h-14 rounded-2xl px-5 text-[15px] font-black transition active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-35 ${styles[variant]} ${className}`}>
      {children}
    </button>
  );
}

export function Field(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`h-14 w-full rounded-2xl border border-cream/10 bg-white/[.06] px-4 font-bold text-cream outline-none placeholder:text-cream/30 focus:border-lime/60 ${props.className ?? ""}`} />;
}

function resizeAvatar(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Foto lezen lukte niet."));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("Foto laden lukte niet."));
      image.onload = () => {
        const size = 280;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Foto verwerken lukte niet."));
          return;
        }
        const sourceSize = Math.min(image.width, image.height) * 0.72;
        const sourceX = (image.width - sourceSize) / 2;
        const sourceY = Math.max(0, (image.height - sourceSize) * 0.38);
        context.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, size, size);
        resolve(canvas.toDataURL("image/jpeg", 0.78));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function PlayerAvatar({
  avatar, size = "md", className = "",
}: { avatar: string; size?: "xs" | "sm" | "md" | "lg"; className?: string }) {
  const sizes = {
    xs: "h-7 w-7 text-base",
    sm: "h-10 w-10 text-xl",
    md: "h-14 w-14 text-3xl",
    lg: "h-24 w-24 text-5xl",
  };
  if (!isPhotoAvatar(avatar)) {
    return (
      <span className={`grid shrink-0 place-items-center rounded-full border border-white/10 bg-black/15 ${sizes[size]} ${className}`}>
        {avatar}
      </span>
    );
  }
  return (
    <span className={`relative inline-block shrink-0 overflow-visible ${sizes[size]} ${className}`}>
      <span className="absolute bottom-[2%] left-1/2 h-[46%] w-[76%] -translate-x-1/2 rounded-[40%_40%_12%_12%] border border-lime/20 bg-lime shadow-[0_6px_0_rgba(0,0,0,.18)]" />
      <span className="absolute bottom-[24%] left-1/2 h-[18%] w-[24%] -translate-x-1/2 rounded-b-full bg-[#f1c27d]" />
      <span className="absolute bottom-[23%] left-[14%] h-[18%] w-[18%] -rotate-12 rounded-full bg-[#f1c27d]" />
      <span className="absolute bottom-[23%] right-[14%] h-[18%] w-[18%] rotate-12 rounded-full bg-[#f1c27d]" />
      <span className="absolute bottom-[16%] left-1/2 h-[13%] w-[34%] -translate-x-1/2 rounded-full bg-black/20 blur-[2px]" />
      <span className="absolute bottom-[13%] left-1/2 -translate-x-1/2 text-[9px] font-black text-ink/35">TOEP</span>
      <span className="absolute left-1/2 top-[-5%] h-[76%] w-[76%] -translate-x-1/2 overflow-hidden rounded-[48%_52%_46%_54%/42%_45%_55%_58%] border-2 border-cream bg-cream shadow-card">
        <img src={avatar} alt="Profielfoto" className="h-full w-full scale-125 object-cover" />
      </span>
    </span>
  );
}

export function AvatarPicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  async function upload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    onChange(await resizeAvatar(file));
    event.target.value = "";
  }

  return (
    <div className="grid gap-3">
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.04] p-3">
        <PlayerAvatar avatar={value} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-black text-cream">Jouw poppetje</div>
          <div className="mt-1 text-xs font-bold normal-case leading-5 text-cream/45">Upload een foto en we zetten je hoofd op een klein Toep-lijfje.</div>
          <label className="mt-3 inline-flex cursor-pointer rounded-full bg-lime px-3 py-2 text-[10px] font-black uppercase tracking-wider text-ink">
            Foto uploaden
            <input type="file" accept="image/*" onChange={upload} className="sr-only" />
          </label>
        </div>
      </div>
      <div className="grid grid-cols-8 gap-1.5">
        {avatars.map((avatar) => (
          <button key={avatar} type="button" onClick={() => onChange(avatar)}
            className={`aspect-square rounded-xl transition ${value === avatar ? "scale-105 bg-lime text-ink" : "bg-white/[.06]"}`}>
            <PlayerAvatar avatar={avatar} size="xs" className="mx-auto" />
          </button>
        ))}
      </div>
    </div>
  );
}

const suitMark = { harten: "♥", ruiten: "♦", klaveren: "♣", schoppen: "♠" };
const rankLabel = { B: "B", V: "V", H: "H", A: "A", "7": "7", "8": "8", "9": "9", "10": "10" };

export function PlayingCard({
  card, onClick, disabled = false, compact = false, delay = 0,
}: { card: CardType; onClick?: () => void; disabled?: boolean; compact?: boolean; delay?: number }) {
  const red = card.suit === "harten" || card.suit === "ruiten";
  return (
    <button onClick={onClick} disabled={disabled || !onClick}
      style={{ animationDelay: `${delay}ms` }}
      className={`card-enter relative shrink-0 overflow-hidden rounded-xl border border-black/10 bg-[#fffdf4] text-left shadow-card transition
        ${compact ? "h-[84px] w-[58px]" : "h-[132px] w-[88px]"}
        ${disabled ? "translate-y-2 opacity-35 grayscale" : onClick ? "-translate-y-1 active:-translate-y-4" : ""}
        ${red ? "text-[#c83e38]" : "text-[#17201b]"}`}>
      <span className={`absolute left-2 top-1 font-black leading-none ${compact ? "text-lg" : "text-2xl"}`}>{rankLabel[card.rank]}</span>
      <span className={`absolute left-2 top-6 leading-none ${compact ? "text-base" : "text-xl"}`}>{suitMark[card.suit]}</span>
      <span className={`absolute inset-0 grid place-items-center ${compact ? "text-3xl" : "text-5xl"}`}>{suitMark[card.suit]}</span>
    </button>
  );
}

export function Scoreboard({ game }: { game: PublicGame }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {game.players.map((player) => (
        <div key={player.id} className={`min-w-[78px] flex-1 rounded-2xl border px-2.5 py-2 transition ${
          game.turnPlayerId === player.id ? "border-lime/70 bg-lime/10" : "border-white/10 bg-black/15"
        } ${!player.active ? "opacity-40" : ""}`}>
          <div className="flex items-center gap-1.5">
            <PlayerAvatar avatar={player.avatar} size="xs" />
            <span className="truncate text-xs font-bold">{player.name}</span>
          </div>
          <div className="mt-1 flex items-end justify-between">
            <span className="text-2xl font-black leading-none">{player.score}</span>
            <span className="text-[9px] font-bold uppercase text-cream/40">/ {game.targetScore}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function PlayerChip({ player, active }: { player: PublicPlayer; active?: boolean }) {
  return (
    <div className={`flex items-center gap-2 rounded-full border px-3 py-2 ${active ? "border-lime/60 bg-lime/10" : "border-white/10 bg-black/15"}`}>
      <PlayerAvatar avatar={player.avatar} size="xs" />
      <span className="max-w-24 truncate text-xs font-bold">{player.name}</span>
      {active && <span className="h-1.5 w-1.5 rounded-full bg-lime" />}
    </div>
  );
}

export function TinyCardBacks({ count }: { count: number }) {
  return (
    <div className="flex -space-x-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="h-8 w-5 rounded border border-lime/30 bg-ink shadow-sm">
          <div className="m-0.5 h-[26px] rounded-sm border border-lime/20" />
        </div>
      ))}
    </div>
  );
}
