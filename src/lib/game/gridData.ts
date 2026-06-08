// Sphere Grid layouts. One grid per cat archetype (uses cat.id as key).
// Hex-ish layout via fixed pixel coordinates; rendered as SVG.

export type GridNodeKind = "hp" | "atk" | "spd" | "mp" | "def" | "od" | "skill";

export interface GridNode {
  id: string;            // unique within grid
  kind: GridNodeKind;
  value: number;         // amount added on unlock
  x: number;             // 0-100 svg %
  y: number;             // 0-100 svg %
  /** Adjacent node ids — drawn as connecting lines, defines unlock paths. */
  neighbors: string[];
  /** A node's first node is unlocked by default (starting cell). */
  start?: boolean;
  /** Display label override; defaults derive from kind. */
  label?: string;
}

export interface GridLayout {
  catId: string;
  nodes: GridNode[];
}

/** Cost is always 1 sphere per node. */
export const NODE_COST = 1;

export const NODE_META: Record<GridNodeKind, { color: string; label: string }> = {
  hp:    { color: "#22c55e", label: "+HP" },
  atk:   { color: "#ef4444", label: "+ATK" },
  def:   { color: "#3b82f6", label: "+DEF" },
  spd:   { color: "#a78bfa", label: "+SPD" },
  mp:    { color: "#06b6d4", label: "+MP" },
  od:    { color: "#f59e0b", label: "+OD" },
  skill: { color: "#ec4899", label: "Skill" },
};

/**
 * Helper to build a 5x4 grid that branches from a center start.
 * Layout is the same shape per cat, but stat distribution differs.
 */
function makeGrid(catId: string, plan: P[][]): GridLayout {
  const cols = 6;
  const rows = plan.length;
  const nodes: GridNode[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const kindRaw = plan[r][c];
      if (!kindRaw) continue;
      const kind = kindRaw as GridNodeKind;
      const id = `${catId}-r${r}c${c}`;
      const value = kind === "hp" ? 12
        : kind === "atk" ? 2
        : kind === "def" ? 2
        : kind === "spd" ? 1
        : kind === "mp"  ? 8
        : kind === "od"  ? 8
        : 0;
      const x = 8 + (c / (cols - 1)) * 84;
      const y = 12 + (r / (rows - 1)) * 76;
      const neighbors: string[] = [];
      // right
      if (c + 1 < cols && plan[r][c + 1]) neighbors.push(`${catId}-r${r}c${c+1}`);
      // down
      if (r + 1 < rows && plan[r + 1][c]) neighbors.push(`${catId}-r${r+1}c${c}`);
      // diagonal for hex feel
      if (r + 1 < rows && c + 1 < cols && plan[r+1][c+1] && (r + c) % 2 === 0)
        neighbors.push(`${catId}-r${r+1}c${c+1}`);
      nodes.push({ id, kind, value, x, y, neighbors,
        start: r === Math.floor(rows / 2) && c === Math.floor(cols / 2) });
    }
  }
  // Make neighbor edges symmetric
  for (const n of nodes) {
    for (const nb of n.neighbors) {
      const other = nodes.find(o => o.id === nb);
      if (other && !other.neighbors.includes(n.id)) other.neighbors.push(n.id);
    }
  }
  return { catId, nodes };
}

// Per-cat plans — different shapes so each grid feels distinct.
// Cells: "" = empty, otherwise a node kind.
type P = GridNodeKind | "";
const blank = "" as P;

const planScrapper: P[][] = [
  ["atk","hp","atk","atk","hp","atk"],
  ["def","atk","spd","atk","def","hp"],
  ["hp","def","atk","atk","spd","atk"],
  ["atk","hp","od","atk","hp","atk"],
];
const planSneakpaw: P[][] = [
  ["spd","spd","atk","spd","atk","spd"],
  ["atk","spd","mp","spd","atk","spd"],
  ["hp","atk","spd","atk","spd","atk"],
  ["spd","atk","od","spd","hp","spd"],
];
const planMoldmancer: P[][] = [
  ["mp","mp","atk","mp","atk","mp"],
  ["atk","mp","spd","mp","atk","mp"],
  ["hp","mp","atk","mp","spd","mp"],
  ["mp","atk","od","mp","hp","mp"],
];
const planTinknight: P[][] = [
  ["def","hp","def","def","hp","def"],
  ["hp","def","atk","def","hp","def"],
  ["def","hp","def","def","atk","def"],
  ["hp","def","od","def","hp","def"],
];
const planGreasefang: P[][] = [
  ["atk","mp","atk","atk","mp","atk"],
  ["mp","atk","spd","atk","mp","atk"],
  ["hp","mp","atk","atk","spd","atk"],
  ["atk","mp","od","atk","hp","atk"],
];

export const GRID_LAYOUTS: Record<string, GridLayout> = {
  scrapper:   makeGrid("scrapper",   planScrapper as P[][]),
  sneakpaw:   makeGrid("sneakpaw",   planSneakpaw as P[][]),
  moldmancer: makeGrid("moldmancer", planMoldmancer as P[][]),
  tinknight:  makeGrid("tinknight",  planTinknight as P[][]),
  greasefang: makeGrid("greasefang", planGreasefang as P[][]),
};

/** Aggregate stat bonuses for unlocked node ids on a given grid. */
export function aggregateGrid(catId: string, unlocked: string[]): Record<GridNodeKind, number> {
  const layout = GRID_LAYOUTS[catId];
  const out: Record<GridNodeKind, number> = { hp:0, atk:0, def:0, spd:0, mp:0, od:0, skill:0 };
  if (!layout) return out;
  const set = new Set(unlocked);
  for (const n of layout.nodes) {
    if (set.has(n.id)) out[n.kind] += n.value;
  }
  return out;
}

/** A node is unlockable if it's the start node OR adjacent to an already-unlocked node. */
export function isUnlockable(layout: GridLayout, unlocked: string[], nodeId: string): boolean {
  const set = new Set(unlocked);
  if (set.has(nodeId)) return false;
  const node = layout.nodes.find(n => n.id === nodeId);
  if (!node) return false;
  if (node.start && unlocked.length === 0) return true;
  return node.neighbors.some(nb => set.has(nb)) || (node.start === true);
}
