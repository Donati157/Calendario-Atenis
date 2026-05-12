import { cn } from "@/lib/utils"
import {
  type CalendarEvent,
  EventList,
  isSchoolDayEvent,
} from "@/lib/calendar"

interface TimelineViewProps {
  list: EventList
  year: number
  month: number
  day: number
}

const TIMELINE_START_MIN = 6 * 60
const TIMELINE_END_MIN = 16 * 60
const PX_PER_MIN = 1.4

type TimelineEntry = {
  id: string
  title: string
  startMin: number
  endMin: number
  color: string
  icon: string
  source: CalendarEvent
}

export function TimelineView({ list, year, month, day }: TimelineViewProps) {
  const dayEvents = list.filterByDate(year, month, day).toArray()

  const entries: TimelineEntry[] = []
  for (const ev of dayEvents) {
    if (isSchoolDayEvent(ev)) {
      for (const p of ev.getPeriods()) {
        entries.push({
          id: `${ev.getId()}-p${p.getIndex()}`,
          title: p.getSubject(),
          startMin: p.getStartMinutes(),
          endMin: p.getEndMinutes(),
          color: p.isAcademic()
            ? "bg-blue-500/20 border-blue-500/40 text-blue-200"
            : "bg-secondary/40 border-border/40 text-muted-foreground italic",
          icon: p.isAcademic() ? "📚" : "·",
          source: ev,
        })
      }
    } else {
      const d = ev.getDate()
      const start = d.getHours() * 60 + d.getMinutes()
      const dur = Math.max(15, ev.getDurationMinutes())
      entries.push({
        id: ev.getId(),
        title: ev.getTitle(),
        startMin: start,
        endMin: start + dur,
        color: ev.getColor(),
        icon: ev.getIcon(),
        source: ev,
      })
    }
  }

  const totalHeight = (TIMELINE_END_MIN - TIMELINE_START_MIN) * PX_PER_MIN
  const hours: number[] = []
  for (let h = TIMELINE_START_MIN / 60; h <= TIMELINE_END_MIN / 60; h++) {
    hours.push(h)
  }

  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        Nenhum evento neste dia. Crie um ou carregue a agenda do José.
      </p>
    )
  }

  return (
    <div className="relative pl-12 pr-2" style={{ height: `${totalHeight}px` }}>
      {hours.map((h) => {
        const top = (h * 60 - TIMELINE_START_MIN) * PX_PER_MIN
        return (
          <div
            key={h}
            className="absolute left-0 right-0 border-t border-border/30 flex items-start"
            style={{ top: `${top}px` }}
          >
            <span className="absolute -left-0 -top-2 text-[10px] font-mono text-muted-foreground w-10 text-right pr-1">
              {String(h).padStart(2, "0")}:00
            </span>
          </div>
        )
      })}

      {entries.map((e) => {
        const top = Math.max(0, (e.startMin - TIMELINE_START_MIN) * PX_PER_MIN)
        const height = Math.max(18, (e.endMin - e.startMin) * PX_PER_MIN - 2)
        return (
          <div
            key={e.id}
            className={cn(
              "absolute left-12 right-2 rounded-md border px-2 py-1 text-xs overflow-hidden",
              e.color,
            )}
            style={{ top: `${top}px`, height: `${height}px` }}
            title={`${e.title} · ${formatMin(e.startMin)}–${formatMin(e.endMin)}`}
          >
            <div className="flex items-center gap-1.5 leading-tight">
              <span className="shrink-0">{e.icon}</span>
              <span className="font-medium truncate">{e.title}</span>
            </div>
            {height > 32 && (
              <div className="text-[10px] opacity-70 font-mono mt-0.5">
                {formatMin(e.startMin)}–{formatMin(e.endMin)}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function formatMin(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

export function totalAcademicMinutes(list: EventList): number {
  let total = 0
  for (const ev of list.toArray()) {
    if (isSchoolDayEvent(ev)) {
      for (const p of ev.getPeriods()) {
        if (p.isAcademic()) total += p.getDurationMinutes()
      }
    }
  }
  return total
}
