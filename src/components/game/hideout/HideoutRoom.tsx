import { useState } from "react";
import { useGame, rarityClass } from "@/lib/game/store";
import { HIDEOUT_STAGES } from "@/lib/game/story";
import type { Item } from "@/lib/game/types";

const ICON_FOR_KIND: Record<string, string> = {
  weapon: "🗡️",
  armor: "🛡️",
  relic: "🏆",
  food: "🐟",
  junk: "🥫",
  crafting: "🧪",
};

export function HideoutRoom() {
  const stage = useGame(s => s.hideoutStage);
  const placed = useGame(s => s.placedItems);
  const inventory = useGame(s => s.inventory);
  const placeItem = useGame(s => s.placeItem);
  const unplaceItem = useGame(s => s.unplaceItem);

  const def = HIDEOUT_STAGES[stage];
  const [pickerSlot, setPickerSlot] = useState<string | null>(null);

  const placedIds = new Set(Object.values(placed));
  const available = inventory.filter(i => !placedIds.has(i.id));

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <div>
          <h2 className="font-display text-3xl uppercase leading-none">{def.name}</h2>
          <p className="text-[11px] italic text-muted-foreground">{def.blurb}</p>
        </div>
        <span className="border-2 border-black bg-accent px-2 py-0.5 text-[10px] font-bold uppercase text-black">
          {def.slots.length} slots
        </span>
      </div>

      <div className="chunky-panel relative overflow-hidden bg-black">
        <img
          src={def.image}
          alt={def.name}
          width={1024}
          height={1024}
          loading="lazy"
          className="aspect-square w-full object-cover md:aspect-[16/10]"
        />
        {/* Slots */}
        {def.slots.map(slot => {
          const itemId = placed[slot.id];
          const item = itemId ? inventory.find(i => i.id === itemId) : null;
          return (
            <button
              key={slot.id}
              onClick={() => setPickerSlot(slot.id)}
              style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 group"
            >
              {item ? (
                <div className={`chunky-panel flex size-12 items-center justify-center bg-white text-2xl md:size-14 ${rarityClass(item.rarity)}`}
                  title={item.name}>
                  <span>{ICON_FOR_KIND[item.kind] ?? "✨"}</span>
                </div>
              ) : (
                <div className="flex size-10 items-center justify-center border-2 border-dashed border-white/70 bg-black/40 text-[10px] font-bold uppercase text-white/80 md:size-12 group-hover:border-primary group-hover:text-primary">
                  +
                </div>
              )}
              <div className="mt-1 hidden whitespace-nowrap rounded border border-black bg-black/80 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white group-hover:block">
                {item ? item.name : slot.label}
              </div>
            </button>
          );
        })}
      </div>

      {/* Picker dialog */}
      {pickerSlot && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/80 p-4" onClick={() => setPickerSlot(null)}>
          <div
            className="chunky-panel w-full max-w-lg bg-black p-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-lg uppercase">Place item</h3>
              <button onClick={() => setPickerSlot(null)} className="text-xs uppercase text-muted-foreground">close</button>
            </div>
            {placed[pickerSlot] && (
              <button
                onClick={() => { unplaceItem(pickerSlot); setPickerSlot(null); }}
                className="chunky-button mb-3 w-full bg-destructive py-2 text-xs font-bold uppercase text-white"
              >
                Remove current item
              </button>
            )}
            <div className="max-h-72 space-y-1 overflow-y-auto">
              {available.length === 0 && (
                <p className="py-6 text-center text-xs italic text-muted-foreground">
                  No spare items in your stash.
                </p>
              )}
              {available.map((item: Item) => (
                <button
                  key={item.id}
                  onClick={() => { placeItem(pickerSlot, item.id); setPickerSlot(null); }}
                  className={`flex w-full items-center gap-3 border-2 border-black bg-slate-900 px-3 py-2 text-left hover:bg-slate-800 ${rarityClass(item.rarity)}`}
                >
                  <span className="text-2xl">{ICON_FOR_KIND[item.kind] ?? "✨"}</span>
                  <div className="flex-1">
                    <div className="text-sm font-bold">{item.name}</div>
                    <div className="text-[10px] uppercase tracking-wider opacity-70">
                      {item.rarity} · {item.kind}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}