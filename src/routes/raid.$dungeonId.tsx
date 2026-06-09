import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useGame } from "@/lib/game/store";
import { RAIDS } from "@/lib/game/raidData";
import { PhaserBattle } from "@/components/game/raid/PhaserBattle";

export const Route = createFileRoute("/raid/$dungeonId")({
  head: ({ params }) => ({
    meta: [
      { title: `Raid: ${params.dungeonId} — Alley Cat Dumpster Divers` },
      { name: "description", content: "Active team raid in progress — CTB turn combat with your three-cat crew against bosses for spheres, loot, and bragging rights." },
      { property: "og:title", content: `Raid: ${params.dungeonId}` },
      { property: "og:description", content: "Active team raid in progress — CTB turn combat with your three-cat crew against bosses for spheres and loot." },
      { property: "og:url", content: `https://alleycatdive.com/raid/${params.dungeonId}` },
    ],
    links: [
      { rel: "canonical", href: `https://alleycatdive.com/raid/${params.dungeonId}` },
    ],
  }),
  component: RaidScreen,
});

function RaidScreen() {
  const { dungeonId } = Route.useParams();
  const raid = useGame(s => s.raid);
  const startRaid = useGame(s => s.startRaid);
  const navigate = useNavigate();
  const def = RAIDS.find(r => r.id === dungeonId);

  useEffect(() => {
    if (!raid || raid.dungeonId !== dungeonId) startRaid(dungeonId);
  }, [dungeonId, raid, startRaid]);

  // After claim/leave, raid becomes null → back to raid list.
  useEffect(() => {
    if (!raid && def) {
      const id = setTimeout(() => navigate({ to: "/raids" }), 50);
      return () => clearTimeout(id);
    }
  }, [raid, def, navigate]);

  if (!def) return <div className="mt-10 text-center text-muted-foreground">Raid not found.</div>;
  if (!raid) return <div className="mt-10 text-center text-muted-foreground">Loading raid…</div>;

  return (
    <div className="mt-2 flex h-[calc(100dvh-7rem)] min-h-0 flex-col gap-2">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl uppercase leading-none">{def.name}</h1>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{def.subtitle}</p>
        </div>
      </header>
      <div className="min-h-0 flex-1">
        <PhaserBattle bgUrl={def.image ?? ""} />
      </div>
    </div>
  );
}
