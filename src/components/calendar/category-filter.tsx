import { cn } from "@/lib/utils"
import type { EventCategory } from "@/lib/calendar"

interface CategoryFilterProps {
  active: Set<EventCategory>
  onToggle: (cat: EventCategory) => void
  counts: Record<EventCategory, number>
}

const ALL: { id: EventCategory; label: string; icon: string; ring: string }[] = [
  { id: "school_day", label: "Aulas", icon: "🏫", ring: "ring-blue-500/40" },
  { id: "special_day", label: "Eventos", icon: "🎉", ring: "ring-violet-500/40" },
  { id: "study", label: "Estudo", icon: "📖", ring: "ring-emerald-500/40" },
  { id: "exam", label: "Provas", icon: "📝", ring: "ring-rose-500/40" },
  { id: "assignment", label: "Tarefas", icon: "📌", ring: "ring-amber-500/40" },
]

export function CategoryFilter({ active, onToggle, counts }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 overflow-x-auto -mx-1 px-1 pb-0.5">
      <span className="hidden xs:inline text-[10px] uppercase tracking-wider text-muted-foreground mr-1 shrink-0">
        Filtros
      </span>
      {ALL.map((cat) => {
        const isOn = active.has(cat.id)
        const count = counts[cat.id]
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onToggle(cat.id)}
            className={cn(
              "text-[10px] sm:text-xs px-2 sm:px-2.5 py-1 rounded-full border transition-all flex items-center gap-1 sm:gap-1.5 shrink-0",
              isOn
                ? `bg-secondary border-border ring-1 ${cat.ring}`
                : "bg-transparent border-border/40 text-muted-foreground hover:border-border hover:text-foreground",
            )}
            title={isOn ? `Esconder ${cat.label}` : `Mostrar ${cat.label}`}
            aria-label={cat.label}
          >
            <span>{cat.icon}</span>
            <span className="hidden xs:inline">{cat.label}</span>
            <span
              className={cn(
                "tabular-nums text-[9px] sm:text-[10px] px-1 rounded",
                isOn ? "bg-background/50" : "bg-secondary/50",
              )}
            >
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
