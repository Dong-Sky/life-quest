import { QUESTLINE_MARK_SRC } from "@/src/lib/brand/questline-mark";

export function QuestlineMark({ className = "h-10 w-10" }: { className?: string }) {
  return <img alt="Questline" className={`shrink-0 rounded-[14px] object-cover ${className}`} src={QUESTLINE_MARK_SRC} />;
}
