import { rarityClass, rarityGlow, useGame } from "@/lib/game/store";

export function RunPile() {
  const dive = useGame(s => s.dive)!;
  const items = dive.collected;
  return (
    <div className="chunky-panel bg-black/85 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Pile So Far</div>
        <div className="text-[10px] font-bold uppercase text-muted-foreground">{items.length} items</div>
      </div>
      <div className="mb-3 grid grid-cols-2 gap-2">
        <Stat icon="🦴" label="Bones" value={dive.bonesFound} accent="text-fishbone" />
        <Stat icon="🧴" label="Caps" value={dive.capsFound} accent="text-bottlecap" />
      </div>
      {items.length === 0 ? (
        <p className="text-xs italic text-muted-foreground">Nothing yet. Smack something.</p>
      ) : (
        <div className="grid grid-cols-2 gap-1.5">
          {items.slice(-8).map(i => (
            <div key={i.id} className={`chunky-panel bg-slate-950 p-1.5 border-l-4 ${rarityClass(i.rarity)} ${rarityGlow(i.rarity)}`}>
              <div className="truncate text-[11px] font-bold">{i.name}</div>
              <div className={`text-[9px] uppercase tracking-widest ${rarityClass(i.rarity)}`}>{i.rarity}</div>
            </div>
          ))}
          {items.length > 8 && (
            <div className="chunky-panel col-span-2 bg-slate-900 p-1.5 text-center text-[10px] font-bold uppercase">
              + {items.length - 8} more
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ icon, label, value, accent }: { icon: string; label: string; value: number; accent: string }) {
  return (
    <div className="chunky-panel bg-slate-950 p-2">
      <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">{icon} {label}</div>
      <div className={`font-display text-xl leading-none ${accent}`}>+{value.toLocaleString()}</div>
    </div>
  );
}