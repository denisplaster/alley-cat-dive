export function TruckTimer({ sec, total }: { sec: number; total: number }) {
  const pct = Math.max(0, Math.min(100, (sec / total) * 100));
  const state =
    pct > 60 ? { label: "Trash Truck Distant", tag: "SAFE", color: "bg-primary", text: "text-primary", pulse: "" } :
    pct > 30 ? { label: "Truck Inbound", tag: "INBOUND", color: "bg-accent", text: "text-accent", pulse: "" } :
    pct > 10 ? { label: "Truck Nearby", tag: "NEARBY", color: "bg-orange-500", text: "text-orange-400", pulse: "animate-pulse" } :
               { label: "Pickup Imminent", tag: "DANGER", color: "bg-destructive", text: "text-destructive", pulse: "animate-flicker" };
  const mm = Math.floor(sec / 60);
  const ss = (sec % 60).toString().padStart(2, "0");
  return (
    <div className={`chunky-panel bg-black/90 p-3 ${pct <= 10 ? "animate-danger-border" : ""}`}>
      <div className={`mb-1 flex items-center justify-between text-[10px] font-bold uppercase ${state.pulse}`}>
        <span className={state.text}>{state.label}</span>
        <span className={`font-display text-base leading-none ${state.text}`}>{mm}:{ss}</span>
      </div>
      <div className="h-3 border-2 border-black bg-slate-900">
        <div className={`h-full ${state.color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-1 text-right text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
        Status: <span className={state.text}>{state.tag}</span>
      </div>
    </div>
  );
}