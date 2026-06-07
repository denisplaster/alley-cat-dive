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
    <div className="mt-1 flex flex-col gap-1.5 pb-2">
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

      {/* Drawer toggles — open log or pile on demand instead of pinning them */}
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

      {drawer === "log" && <CombatLog />}
      {drawer === "pile" && <RunPile />}

      <LootToast />
    </div>
  );
}