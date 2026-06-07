import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useGame } from "@/lib/game/store";
import { DungeonStage } from "@/components/game/dive/DungeonStage";
import { RunHeader } from "@/components/game/dive/RunHeader";
import { RoomPath } from "@/components/game/dive/RoomPath";
import { TruckTimer } from "@/components/game/dive/TruckTimer";
import { ActionBar } from "@/components/game/dive/ActionBar";
import { CombatLog } from "@/components/game/dive/CombatLog";
import { RunPile } from "@/components/game/dive/RunPile";
import { LootToast } from "@/components/game/dive/LootToast";

export const Route = createFileRoute("/dive")({
  head: () => ({
    meta: [
      { title: "Dumpster Dive — Alley Cat Dumpster Divers" },
      { name: "description", content: "Active dive in progress. Fight, loot, escape before the trash truck." },
      { property: "og:title", content: "Dumpster Dive" },
      { property: "og:description", content: "Active dive in progress." },
    ],
  }),
  component: DiveScreen,
});

function DiveScreen() {
  const dive = useGame(s => s.dive);
  const startDive = useGame(s => s.startDive);
  const tickDive = useGame(s => s.tickDive);
  const cats = useGame(s => s.cats);
  const dumpsters = useGame(s => s.dumpsters);
  const lastRewards = useGame(s => s.lastRewards);
  const navigate = useNavigate();
  const [drawer, setDrawer] = useState<null | "log" | "pile">(null);

  useEffect(() => {
    if (!dive && !lastRewards) startDive();
  }, [dive, lastRewards, startDive]);

  useEffect(() => {
    if (lastRewards) navigate({ to: "/loot" });
  }, [lastRewards, navigate]);

  useEffect(() => {
    if (!dive || dive.ended) return;
    const id = setInterval(() => tickDive(), 1000);
    return () => clearInterval(id);
  }, [dive?.ended, tickDive, dive]);

  if (!dive) {
    return <div className="mt-10 text-center text-muted-foreground">Spinning up the dive…</div>;
  }

  const cat = cats.find(c => c.id === dive.catId)!;
  const dump = dumpsters.find(d => d.id === dive.dumpsterId)!;

  return (
    <div className="mt-1 flex h-[calc(100dvh-7rem)] flex-col gap-1.5 pb-2">
      {/* Ultra-compact top strip */}
      <RunHeader dump={dump} room={dive.room} totalRooms={dive.totalRooms} />
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-1.5">
        <TruckTimer sec={dive.timerSec} total={dive.truckTimerStart} />
        <RoomPath rooms={dive.rooms} current={dive.room} />
      </div>

      {/* Main stage */}
      <DungeonStage cat={cat} enemy={dive.enemy} />

      {/* Actions */}
      <ActionBar />

      {/* Drawer toggles — kept inline above the action bar so the fixed bottom nav can't hide them */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => setDrawer(d => d === "log" ? null : "log")}
          className={`chunky-button px-3 py-2 text-xs font-bold uppercase ${drawer === "log" ? "bg-primary text-primary-foreground" : "bg-slate-900"}`}
        >
          📜 Combat Log
        </button>
        <button
          onClick={() => setDrawer(d => d === "pile" ? null : "pile")}
          className={`chunky-button px-3 py-2 text-xs font-bold uppercase ${drawer === "pile" ? "bg-secondary text-black" : "bg-slate-900"}`}
        >
          🎒 Pile ({dive.collected.length})
        </button>
      </div>

      {/* Drawer content opens as an overlay above the fixed bottom nav so it isn't hidden behind it */}
      {drawer && (
        <div className="fixed inset-x-0 bottom-[5.5rem] z-50 px-3 md:px-6 md:bottom-[6.5rem]">
          <div className="mx-auto w-full max-w-7xl">
            <div className="chunky-panel max-h-[55dvh] overflow-y-auto bg-slate-950/95 p-2 backdrop-blur">
              <div className="mb-2 flex items-center justify-between">
                <div className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  {drawer === "log" ? "Combat Log" : "Run Pile"}
                </div>
                <button
                  onClick={() => setDrawer(null)}
                  className="chunky-button bg-slate-900 px-2 py-1 text-[10px] font-bold uppercase"
                >
                  Close ✕
                </button>
              </div>
              {drawer === "log" ? <CombatLog /> : <RunPile />}
            </div>
          </div>
        </div>
      )}

      <LootToast />
    </div>
  );
}