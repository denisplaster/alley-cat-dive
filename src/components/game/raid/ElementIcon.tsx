import { ELEMENT_META, type Element } from "@/lib/game/raidTypes";

export function ElementIcon({ el, size = "sm" }: { el: Element; size?: "xs"|"sm"|"md" }) {
  const px = size === "xs" ? "text-[10px]" : size === "md" ? "text-base" : "text-xs";
  return <span className={`${ELEMENT_META[el].color} ${px}`} title={ELEMENT_META[el].label}>{ELEMENT_META[el].icon}</span>;
}
