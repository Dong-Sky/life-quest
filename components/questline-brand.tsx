export function QuestlineMark({ className = "h-10 w-10" }: { className?: string }) {
  return <svg aria-label="Questline" className={`shrink-0 ${className}`} fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
    <rect height="46" rx="14" width="46" x="1" y="1" className="fill-white stroke-[var(--line)]" strokeWidth="2" />
    <path d="M14 31.5 24 15l10 16.5" className="stroke-[var(--accent)]" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.2" />
    <path d="M18.5 25.5h11" className="stroke-[var(--accent)]" strokeLinecap="round" strokeWidth="3.2" />
    <circle cx="14" cy="31.5" r="3" className="fill-[var(--accent)]" />
    <circle cx="24" cy="15" r="3" className="fill-[var(--accent)]" />
    <circle cx="34" cy="31.5" r="3" className="fill-[var(--gold)]" />
  </svg>;
}
