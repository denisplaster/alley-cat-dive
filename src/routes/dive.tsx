import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useGame } from "@/lib/game/store";
import { DungeonStage } from "@/components/game/dive/DungeonStage";
import { RunHeader } from "@/components/game/dive/RunHeader";
import { RoomPath } from "@/components/game/dive/RoomPath";
import { TruckTimer } from "@/components/game/dive/TruckTimer";
import { ActionBar } from "@/components/game/dive/ActionBar";
import { CombatLog } from "@/components/game/dive/CombatLog";
import { RunPile } from "@/components/game/dive/RunPile";
import { LootToast } from "@/components/game/dive/LootToast";
import { Objective } from "@/components/game/dive/Objective";

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
    <div className="mt-2 space-y-3 pb-32 md:pb-36">
      <RunHeader dump={dump} room={dive.room} totalRooms={dive.totalRooms} />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
        <div className="space-y-3 lg:col-span-8">
          <RoomPath rooms={dive.rooms} current={dive.room} />
          <TruckTimer sec={dive.timerSec} total={dive.truckTimerStart} />
          <DungeonStage cat={cat} enemy={dive.enemy} />
          <Objective />
          <ActionBar />
        </div>
        <div className="space-y-3 lg:col-span-4">
          <CombatLog />
          <RunPile />
        </div>
      </div>

      <LootToast />
    </div>
  );
}