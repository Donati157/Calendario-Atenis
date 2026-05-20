import { cn } from "@/lib/utils"
import {
  type CalendarEvent,
  EventList,
  isSchoolDayEvent,
  isSpecialDayEvent,
} from "@/lib/calendar"

// Grid hora-a-hora estilo Apple Calendar — uma coluna (DayView) ou
// sete (WeekView). Período coberto: 06:00 → 22:00.
const HOUR_START = 6
const HOUR_END = 22
const PX_PER_HOUR = 56
const TOTAL_MIN = (HOUR_END - HOUR_START) * 60
const TOTAL_PX = (HOUR_END - HOUR_START) * PX_PER_HOUR

// ────────────────────────────────────────────────────────
// Tipos / helpers
// ────────────────────────────────────────────────────────

export type TimedEntry = {
  id: string
  title: string
  icon: string
  // minutos desde meia-noite
  startMin: number
  endMin: number
  // tailwind classes
  color: string
  source: CalendarEvent
}

export type AllDayEntry = {
  id: string
  title: string
  icon: string
  color: string
  source: CalendarEvent
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`
}

function fmtTime(min: number): string {
  return `${pad(Math.floor(min / 60))}:${pad(min % 60)}`
}

// SchoolDayEvent vira N entradas (uma por Period). Eventos normais
// viram 1 entrada. SpecialDayEvent vira all-day no topo.
function expandEvents(events: CalendarEvent[]): {
  timed: TimedEntry[]
  allDay: AllDayEntry[]
} {
  const timed: TimedEntry[] = []
  const allDay: AllDayEntry[] = []

  for (const ev of events) {
    if (isSpecialDayEvent(ev)) {
      allDay.push({
        id: ev.getId(),
        title: ev.getTitle(),
        icon: ev.getIcon(),
        color: ev.getColor(),
        source: ev,
      })
      continue
    }

    if (isSchoolDayEvent(ev)) {
      for (const p of ev.getPeriods()) {
        timed.push({
          id: `${ev.getId()}-p${p.getIndex()}`,
          title: p.getSubject(),
          icon: p.isAcademic() ? "📚" : "·",
          startMin: p.getStartMinutes(),
          endMin: p.getEndMinutes(),
          color: p.isAcademic()
            ? "bg-blue-500/25 border-blue-500/50 text-blue-50"
            : "bg-secondary/40 border-border/40 text-muted-foreground italic",
          source: ev,
        })
      }
      continue
    }

    // Study / Exam / Assignment: usa data + duração default da subclass.
    const d = ev.getDate()
    const startMin = d.getHours() * 60 + d.getMinutes()
    const dur = Math.max(15, ev.getDurationMinutes()) // 15min mínimo visível
    timed.push({
      id: ev.getId(),
      title: ev.getTitle(),
      icon: ev.getIcon(),
      startMin,
      endMin: startMin + dur,
      color: ev.getColor(),
      source: ev,
    })
  }

  return { timed, allDay }
}

function topPx(startMin: number): number {
  return (Math.max(HOUR_START * 60, startMin) - HOUR_START * 60) * (PX_PER_HOUR / 60)
}

function heightPx(startMin: number, endMin: number): number {
  const start = Math.max(HOUR_START * 60, startMin)
  const end = Math.min(HOUR_END * 60, endMin)
  return Math.max(18, (end - start) * (PX_PER_HOUR / 60) - 2)
}

// Coluna vertical com hora-a-hora marcada. Recebe o conteúdo (entries).
function HourGridColumn({
  timed,
  showLeftRule = false,
  highlightToday = false,
  onEntryClick,
}: {
  timed: TimedEntry[]
  showLeftRule?: boolean
  highlightToday?: boolean
  onEntryClick?: (entry: TimedEntry) => void
}) {
  const hours: number[] = []
  for (let h = HOUR_START; h <= HOUR_END; h++) hours.push(h)

  return (
    <div
      className={cn(
        "relative border-l border-border/30",
        highlightToday && "bg-accent/[0.02]",
      )}
      style={{ height: `${TOTAL_PX}px` }}
    >
      {/* régua horizontal */}
      {hours.map((h) => {
        const top = (h - HOUR_START) * PX_PER_HOUR
        return (
          <div
            key={h}
            className="absolute left-0 right-0 border-t border-border/20"
            style={{ top: `${top}px` }}
          />
        )
      })}

      {/* eventos — viram botões clicáveis quando onEntryClick existe */}
      {timed.map((e) => {
        const isOutOfRange =
          e.endMin <= HOUR_START * 60 || e.startMin >= HOUR_END * 60
        if (isOutOfRange) return null
        const inner = (
          <>
            <div className="flex items-center gap-1 leading-tight font-medium">
              <span className="shrink-0">{e.icon}</span>
              <span className="truncate">{e.title}</span>
            </div>
            {heightPx(e.startMin, e.endMin) > 30 && (
              <div className="text-[10px] opacity-70 font-mono mt-0.5">
                {fmtTime(e.startMin)}–{fmtTime(e.endMin)}
              </div>
            )}
          </>
        )
        const className = cn(
          "absolute left-1 right-1 rounded-md border px-1.5 py-0.5 text-[11px] overflow-hidden shadow-sm text-left",
          e.color,
          onEntryClick && "cursor-pointer hover:brightness-110 transition-all",
        )
        const style = {
          top: `${topPx(e.startMin)}px`,
          height: `${heightPx(e.startMin, e.endMin)}px`,
        }
        const titleAttr = `${e.title} · ${fmtTime(e.startMin)}–${fmtTime(e.endMin)}`
        return onEntryClick ? (
          <button
            key={e.id}
            type="button"
            className={className}
            style={style}
            title={titleAttr}
            onClick={() => onEntryClick(e)}
          >
            {inner}
          </button>
        ) : (
          <div key={e.id} className={className} style={style} title={titleAttr}>
            {inner}
          </div>
        )
      })}

      {showLeftRule &&
        hours.map((h) => {
          const top = (h - HOUR_START) * PX_PER_HOUR
          return (
            <span
              key={`label-${h}`}
              className="absolute -left-10 sm:-left-12 text-[10px] font-mono text-muted-foreground"
              style={{ top: `${top - 6}px`, width: "2.25rem", textAlign: "right" }}
            >
              {pad(h)}:00
            </span>
          )
        })}
    </div>
  )
}

// ────────────────────────────────────────────────────────
// DayView — uma única coluna
// ────────────────────────────────────────────────────────

interface DayViewProps {
  list: EventList
  year: number
  month: number
  day: number
  onEntryClick?: (entry: TimedEntry) => void
  onAllDayClick?: (entry: AllDayEntry) => void
}

const WEEKDAY_LABELS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
]

const WEEKDAY_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

const MONTH_LABELS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
]

export function DayView({
  list,
  year,
  month,
  day,
  onEntryClick,
  onAllDayClick,
}: DayViewProps) {
  const events = list.filterByDate(year, month, day).toArray()
  const { timed, allDay } = expandEvents(events)

  const date = new Date(year, month, day)
  const weekdayName = WEEKDAY_LABELS[date.getDay()]
  const today = new Date()
  const isToday =
    today.getFullYear() === year &&
    today.getMonth() === month &&
    today.getDate() === day

  return (
    <div>
      {/* cabeçalho do dia */}
      <div className="flex flex-col xs:flex-row xs:items-baseline gap-1 xs:gap-3 mb-3 sm:mb-4 pb-2 sm:pb-3 border-b border-border/40">
        <div className="text-2xl sm:text-3xl font-bold font-display">
          {day} {MONTH_LABELS[month]}{" "}
          <span className="font-normal text-muted-foreground">{year}</span>
        </div>
        <div className={cn("text-xs sm:text-sm", isToday ? "text-accent" : "text-muted-foreground")}>
          {weekdayName}
          {isToday && " · hoje"}
        </div>
      </div>

      {/* all-day */}
      {allDay.length > 0 && (
        <div className="pl-10 sm:pl-14 pr-1 mb-3 pb-3 border-b border-border/30">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
            o dia todo
          </div>
          <div className="space-y-1">
            {allDay.map((e) =>
              onAllDayClick ? (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => onAllDayClick(e)}
                  className={cn(
                    "w-full rounded-md border px-2 py-1 text-xs flex items-center gap-1.5 text-left hover:brightness-110 transition-all",
                    e.color,
                  )}
                >
                  <span>{e.icon}</span>
                  <span className="font-medium">{e.title}</span>
                </button>
              ) : (
                <div
                  key={e.id}
                  className={cn(
                    "rounded-md border px-2 py-1 text-xs flex items-center gap-1.5",
                    e.color,
                  )}
                >
                  <span>{e.icon}</span>
                  <span className="font-medium">{e.title}</span>
                </div>
              ),
            )}
          </div>
        </div>
      )}

      {/* grid horário */}
      <div className="pl-10 sm:pl-14 pr-1 relative">
        <HourGridColumn
          timed={timed}
          showLeftRule
          highlightToday={isToday}
          onEntryClick={onEntryClick}
        />
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────
// WeekView — 7 colunas
// ────────────────────────────────────────────────────────

interface WeekViewProps {
  list: EventList
  // qualquer data dentro da semana — a semana é Dom→Sáb
  year: number
  month: number
  day: number
  onPickDay?: (year: number, month: number, day: number) => void
  onEntryClick?: (entry: TimedEntry) => void
  onAllDayClick?: (entry: AllDayEntry) => void
}

export function WeekView({
  list,
  year,
  month,
  day,
  onPickDay,
  onEntryClick,
  onAllDayClick,
}: WeekViewProps) {
  // Acha o domingo da semana que contém a data passada.
  const ref = new Date(year, month, day)
  const sunday = new Date(year, month, day - ref.getDay())

  const days: Array<{ year: number; month: number; day: number; isToday: boolean }> =
    []
  const now = new Date()
  for (let i = 0; i < 7; i++) {
    const d = new Date(
      sunday.getFullYear(),
      sunday.getMonth(),
      sunday.getDate() + i,
    )
    days.push({
      year: d.getFullYear(),
      month: d.getMonth(),
      day: d.getDate(),
      isToday:
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate(),
    })
  }

  // Cabeçalho do mês (do domingo). Se a semana cruza dois meses, mostra os dois.
  const firstMonth = days[0].month
  const lastMonth = days[6].month
  const firstYear = days[0].year
  const lastYear = days[6].year
  const headerLabel =
    firstMonth === lastMonth && firstYear === lastYear
      ? `${MONTH_LABELS[firstMonth]} ${firstYear}`
      : `${MONTH_LABELS[firstMonth]}/${MONTH_LABELS[lastMonth]} ${lastYear}`

  return (
    <div>
      <div className="text-xl sm:text-2xl font-bold font-display mb-3 sm:mb-4 pb-2 sm:pb-3 border-b border-border/40">
        {headerLabel}
      </div>

      {/* Wrapper com scroll horizontal no mobile; cada coluna tem >= 70px */}
      <div className="overflow-x-auto -mx-2 px-2 pb-2">
        <div className="min-w-[560px]">

      {/* faixa "o dia todo" */}
      <div className="grid grid-cols-[2.5rem_repeat(7,minmax(0,1fr))] sm:grid-cols-[3.5rem_repeat(7,minmax(0,1fr))] mb-1">
        <div />
        {days.map((d) => {
          const evs = list.filterByDate(d.year, d.month, d.day).toArray()
          const allDay = evs.filter(isSpecialDayEvent)
          return (
            <div
              key={`ad-${d.year}-${d.month}-${d.day}`}
              className="border-l border-border/30 px-1 py-1 min-h-[1.5rem] flex flex-col gap-0.5"
            >
              {allDay.map((ev) =>
                onAllDayClick ? (
                  <button
                    key={ev.getId()}
                    type="button"
                    className={cn(
                      "text-[10px] rounded px-1 truncate border text-left hover:brightness-110 transition-all",
                      ev.getColor(),
                    )}
                    title={ev.getTitle()}
                    onClick={() =>
                      onAllDayClick({
                        id: ev.getId(),
                        title: ev.getTitle(),
                        icon: ev.getIcon(),
                        color: ev.getColor(),
                        source: ev,
                      })
                    }
                  >
                    {ev.getIcon()} {ev.getTitle()}
                  </button>
                ) : (
                  <div
                    key={ev.getId()}
                    className={cn(
                      "text-[10px] rounded px-1 truncate border",
                      ev.getColor(),
                    )}
                    title={ev.getTitle()}
                  >
                    {ev.getIcon()} {ev.getTitle()}
                  </div>
                ),
              )}
            </div>
          )
        })}
      </div>

      {/* cabeçalho dos dias */}
      <div className="grid grid-cols-[2.5rem_repeat(7,minmax(0,1fr))] sm:grid-cols-[3.5rem_repeat(7,minmax(0,1fr))] mb-1">
        <div />
        {days.map((d) => (
          <button
            key={`hdr-${d.year}-${d.month}-${d.day}`}
            type="button"
            onClick={() => onPickDay?.(d.year, d.month, d.day)}
            className={cn(
              "border-l border-border/30 py-1 text-center text-xs hover:bg-secondary/30 transition-colors",
              d.isToday && "text-accent font-semibold",
            )}
          >
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {WEEKDAY_SHORT[new Date(d.year, d.month, d.day).getDay()]}
            </div>
            <div
              className={cn(
                "text-base font-bold tabular-nums mt-0.5",
                d.isToday &&
                  "inline-flex items-center justify-center w-7 h-7 rounded-full bg-accent text-accent-foreground",
              )}
            >
              {d.day}
            </div>
          </button>
        ))}
      </div>

      {/* grid horário */}
      <div className="grid grid-cols-[2.5rem_repeat(7,minmax(0,1fr))] sm:grid-cols-[3.5rem_repeat(7,minmax(0,1fr))] relative">
        {/* coluna de horas (régua à esquerda) */}
        <div className="relative" style={{ height: `${TOTAL_PX}px` }}>
          {Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => {
            const h = HOUR_START + i
            const top = i * PX_PER_HOUR
            return (
              <span
                key={`label-${h}`}
                className="absolute right-1 text-[10px] font-mono text-muted-foreground"
                style={{ top: `${top - 6}px` }}
              >
                {pad(h)}:00
              </span>
            )
          })}
        </div>

        {/* 7 colunas de dias */}
        {days.map((d) => {
          const evs = list.filterByDate(d.year, d.month, d.day).toArray()
          const { timed } = expandEvents(evs)
          return (
            <HourGridColumn
              key={`col-${d.year}-${d.month}-${d.day}`}
              timed={timed}
              highlightToday={d.isToday}
              onEntryClick={onEntryClick}
            />
          )
        })}
      </div>

        </div>
      </div>
    </div>
  )
}

// Garante que helpers usados por outros lugares ficam exportáveis.
void TOTAL_MIN
