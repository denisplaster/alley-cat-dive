import { useEffect, useState } from "react";
import { rarityClass, rarityGlow, useGame } from "@/lib/game/store";
import type { Item } from "@/lib/game/types";

export function LootToast() {
  const lastLootKey = useGame(s => s.dive?.lastLootKey ?? 0);
  const collected = useGame(s => s.dive?.collected ?? []);
  const [shown, setShown] = useState<Item | null>(null);

  useEffect(() => {
    if (lastLootKey === 0 || collected.length === 0) return;
    setShown(collected[collected.length - 1]);
    const t = setTimeout(() => setShown(null), 2200);
    return () => clearTimeout(t);
  }, [lastLootKey, collected]);

  if (!shown) return null;
  return (
    <div className="pointer-events-none fixed bottom-24 right-6 z-50">
      <div className={`chunky-panel bg-black px-4 py-3 animate-banner-slam ${rarityGlow(shown.rarity)} animate-pulse-glow`}>
        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Loot Acquired</div>
        <div className={`font-display text-lg uppercase ${rarityClass(shown.rarity)}`}>{shown.name}</div>
        <div className={`text-[10px] uppercase tracking-widest ${rarityClass(shown.rarity)}`}>{shown.rarity}</div>
      </div>
    </div>
  );
}