import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useGame } from "@/lib/game/store";
import alleyBg from "@/assets/alley-bg.jpg";

const NAV = [
  { to: "/", label: "Hub" },
  { to: "/map", label: "Map" },
  { to: "/crew", label: "Crew" },
  { to: "/inventory", label: "Stash" },
  { to: "/hideout", label: "Hideout" },
  { to: "/shop", label: "Shop" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const playerLevel = useGame(s => s.playerLevel);
  const playerXp = useGame(s => s.playerXp);
  const fishbones = useGame(s => s.fishbones);
  const bottlecaps = useGame(s => s.bottlecaps);
  const pathname = useRouterState({ select: s => s.location.pathname });

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-background text-foreground selection:bg-secondary/40">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <img
          src={alleyBg}
          alt=""
          aria-hidden
          className="h-full w-full object-cover opacity-30 saturate-150"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />
      </div>
      {/* CRT */}
      <div className="crt-overlay fixed inset-0 z-40" />
      {/* Vignette */}
      <div className="pointer-events-none fixed inset-0 z-40 shadow-[inset_0_0_180px_rgba(0,0,0,0.85)]" />
      {/* Random fly */}
      <div className="pointer-events-none fixed left-[20%] top-[18%] z-30 animate-fly text-2xl select-none">🪰</div>
      <div className="pointer-events-none fixed right-[14%] top-[34%] z-30 animate-fly text-xl select-none" style={{ animationDelay: "1.4s" }}>🪰</div>

      {/* Top HUD */}
      <header className="relative z-30 flex flex-wrap items-start justify-between gap-3 p-4 md:p-6">
        <Link to="/" className="flex items-end gap-3">
          <div className="chunky-panel rotate-[-2deg] bg-accent px-3 py-1.5 text-black">
            <div className="text-[10px] font-bold uppercase tracking-tight leading-none">Lvl</div>
            <div className="font-display text-2xl leading-none">{playerLevel}</div>
          </div>
          <div className="mt-1 flex flex-col gap-1">
            <div className="font-display text-sm uppercase tracking-widest text-primary leading-none">Alley Cat</div>
            <div className="chunky-panel h-3 w-32 bg-black p-[2px]">
              <div className="h-full bg-secondary" style={{ width: `${playerXp}%` }} />
            </div>
          </div>
        </Link>

        <div className="flex gap-2 md:gap-3">
          <Currency label="Fishbones" value={fishbones} bg="bg-white" text="text-black" pip="bg-accent" />
          <Currency label="Caps" value={bottlecaps} bg="bg-slate-800" text="text-secondary" pip="bg-secondary" />
        </div>
      </header>

      <main className="relative z-20 mx-auto w-full max-w-7xl px-4 pb-40 md:px-6">
        {children}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 z-40 w-full px-4 pb-4 md:pb-6">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-center gap-2">
          {NAV.map(n => {
            const active = (n.to === "/" && pathname === "/") || (n.to !== "/" && pathname.startsWith(n.to));
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`chunky-button px-4 py-2 text-xs md:text-sm font-bold uppercase tracking-wider ${active ? "bg-primary text-black" : "bg-slate-900 text-foreground hover:bg-slate-800"}`}
              >
                {n.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function Currency({ label, value, bg, text, pip }: { label: string; value: number; bg: string; text: string; pip: string }) {
  return (
    <div className={`chunky-panel flex items-center gap-2 px-3 py-1.5 ${bg} ${text}`}>
      <div className={`flex size-5 items-center justify-center rounded-full border-2 border-black text-[10px] font-bold text-black ${pip}`}>
        {label[0]}
      </div>
      <div className="font-display text-lg leading-none">{value.toLocaleString()}</div>
      <div className="hidden text-[10px] font-bold uppercase tracking-wider opacity-70 md:block">{label}</div>
    </div>
  );
}