import { useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Code2,
  Trash2,
  Search,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  CalendarEvent,
  CalendarGrid,
  EventList,
  EventScheduler,
  StudyEvent,
  ExamEvent,
  AssignmentEvent,
  eventFromJSON,
  isStudyEvent,
  isExamEvent,
  isAssignmentEvent,
  isSchoolDayEvent,
  isSpecialDayEvent,
  RotationEngine,
  ROTATION_ID_PREFIX,
  MAX_DATE,
  isAfterMax,
  type EventCategory,
  type ExamType,
  type SerializedEvent,
} from "@/lib/calendar"
import { EventForm } from "@/components/calendar/event-form"
import { CategoryFilter } from "@/components/calendar/category-filter"
import { CommandPalette } from "@/components/calendar/command-palette"
import {
  DayView,
  WeekView,
  type TimedEntry,
  type AllDayEntry,
} from "@/components/calendar/day-week-view"
import {
  EventDetailModal,
  type DetailTarget,
} from "@/components/calendar/event-detail-modal"
import { totalAcademicMinutes } from "@/components/calendar/timeline-view"
import { useKeyboardShortcuts } from "@/lib/use-keyboard-shortcuts"

type ViewMode = "day" | "week" | "month"
const ALL_CATS: EventCategory[] = [
  "school_day",
  "special_day",
  "study",
  "exam",
  "assignment",
]

const STORAGE_KEY = "calendario.jose.events"

// Eventos da ROTAÇÃO são determinísticos — geramos sob demanda.
// localStorage guarda só os eventos criados pelo usuário (study/exam/
// assignment) — esses sim persistem.
function isRotationEvent(ev: CalendarEvent): boolean {
  return ev.getId().startsWith(ROTATION_ID_PREFIX)
}

function loadUserEvents(): EventList {
  if (typeof window === "undefined") return new EventList()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return new EventList()
    const arr = JSON.parse(raw) as SerializedEvent[]
    const list = new EventList()
    for (const r of arr) {
      // Ignora qualquer evento de rotação que tenha sobrado de versões
      // anteriores no localStorage — esses são regenerados.
      if (typeof r.id === "string" && r.id.startsWith(ROTATION_ID_PREFIX)) {
        continue
      }
      list.add(eventFromJSON(r))
    }
    return list
  } catch {
    return new EventList()
  }
}

function saveUserEvents(list: EventList): void {
  if (typeof window === "undefined") return
  try {
    const userOnly = list
      .toArray()
      .filter((ev) => !isRotationEvent(ev))
      .map((ev) => ev.toJSON())
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(userOnly))
  } catch {
    // ignora — quota cheia / modo privado
  }
}

export function CalendarClient() {
  const today = useMemo(() => new Date(), [])
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  // userList = eventos criados pelo usuário (persistidos em localStorage).
  // list (derivado abaixo) = userList + rotação do mês visível.
  const [userList, setUserList] = useState<EventList>(() => new EventList())
  const [tick, setTick] = useState(0)
  // bump() é chamado após TODA mutação da userList. Persiste no
  // localStorage e força re-render via tick.
  const bump = () => {
    saveUserEvents(userList)
    setTick((t) => t + 1)
  }

  const [selected, setSelected] = useState<{
    year: number
    month: number
    day: number
  } | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  // Modal de detalhes: aparece quando o usuário clica num bloco/evento.
  const [detailTarget, setDetailTarget] = useState<DetailTarget | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>("month")
  const [activeCats, setActiveCats] = useState<Set<EventCategory>>(
    () => new Set(ALL_CATS),
  )
  const toggleCat = (cat: EventCategory) => {
    setActiveCats((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  // Carrega só os eventos do usuário uma vez no mount.
  useEffect(() => {
    setUserList(loadUserEvents())
  }, [])

  const grid = useMemo(() => new CalendarGrid(year, month), [year, month])

  // Rotação do mês visível — gerada na hora pela RotationEngine.
  // Re-roda só quando year/month mudam (custo desprezível: ~30 dias).
  const rotationEvents = useMemo(
    () => RotationEngine.generateForMonth(year, month),
    [year, month],
  )

  // LISTA MESCLADA = userList + rotação. É o que TODA a UI usa.
  const list = useMemo(() => {
    const merged = new EventList()
    for (const ev of userList.toArray()) merged.add(ev)
    for (const ev of rotationEvents) merged.add(ev)
    return merged
    // tick força recomputo após mutar userList in-place via bump()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userList, rotationEvents, tick])

  // Lista FILTRADA pelos chips.
  const filteredList = useMemo(() => {
    if (activeCats.size === ALL_CATS.length) return list
    const out = new EventList()
    for (const ev of list.toArray()) {
      if (activeCats.has(ev.getCategory())) out.add(ev)
    }
    return out
  }, [list, activeCats])

  const byDay = useMemo(() => {
    return EventScheduler.groupByDay(filteredList)
  }, [filteredList])

  const counts = useMemo(() => list.countByCategory(), [list])
  const sorted = useMemo(() => filteredList.sortedByDate(), [filteredList])
  const next = useMemo(() => {
    const sortedList = new EventList(sorted)
    return EventScheduler.nextUpcoming(sortedList)
  }, [sorted])
  const academicMinutes = useMemo(
    () => totalAcademicMinutes(list),
    [list],
  )

  // Navegação adaptativa: ← → significa coisa diferente em cada view.
  //   Day:    -1 dia / +1 dia
  //   Week:   -7 dias / +7 dias
  //   Month:  -1 mês / +1 mês
  //
  // Calendário NÃO acessa nada depois de MAX_DATE (30/06/2026).
  const stepDate = useCallback(
    (deltaDays: number) => {
      const ref = selected
        ? new Date(selected.year, selected.month, selected.day)
        : new Date(year, month, 1)
      const next = new Date(
        ref.getFullYear(),
        ref.getMonth(),
        ref.getDate() + deltaDays,
      )
      // Clamp: se passou do limite, encosta no MAX_DATE.
      if (
        isAfterMax(next.getFullYear(), next.getMonth(), next.getDate())
      ) {
        next.setFullYear(MAX_DATE.year)
        next.setMonth(MAX_DATE.month)
        next.setDate(MAX_DATE.day)
      }
      setYear(next.getFullYear())
      setMonth(next.getMonth())
      setSelected({
        year: next.getFullYear(),
        month: next.getMonth(),
        day: next.getDate(),
      })
    },
    [selected, year, month],
  )

  const stepMonth = useCallback(
    (delta: number) => {
      let newMonth = month + delta
      let newYear = year
      while (newMonth < 0) {
        newMonth += 12
        newYear--
      }
      while (newMonth > 11) {
        newMonth -= 12
        newYear++
      }
      // Clamp: não passa do mês do MAX_DATE.
      if (
        newYear > MAX_DATE.year ||
        (newYear === MAX_DATE.year && newMonth > MAX_DATE.month)
      ) {
        newYear = MAX_DATE.year
        newMonth = MAX_DATE.month
      }
      setYear(newYear)
      setMonth(newMonth)
    },
    [year, month],
  )

  // Verifica se o usuário já está no limite do calendário.
  const isAtMax = useMemo(() => {
    if (viewMode === "day") {
      const d = selected ?? { year, month, day: today.getDate() }
      return (
        d.year === MAX_DATE.year &&
        d.month === MAX_DATE.month &&
        d.day >= MAX_DATE.day
      )
    }
    if (viewMode === "week") {
      // Semana é Dom..Sáb. Se o sábado >= MAX_DATE, está na última semana.
      const ref = selected
        ? new Date(selected.year, selected.month, selected.day)
        : new Date(year, month, 1)
      const saturday = new Date(
        ref.getFullYear(),
        ref.getMonth(),
        ref.getDate() - ref.getDay() + 6,
      )
      const maxD = new Date(MAX_DATE.year, MAX_DATE.month, MAX_DATE.day)
      return saturday.getTime() >= maxD.getTime()
    }
    // month
    return year === MAX_DATE.year && month === MAX_DATE.month
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, selected, year, month])

  const goPrev = useCallback(() => {
    if (viewMode === "day") stepDate(-1)
    else if (viewMode === "week") stepDate(-7)
    else stepMonth(-1)
  }, [viewMode, stepDate, stepMonth])

  const goNext = useCallback(() => {
    if (isAtMax) return // bloqueado pelo cap
    if (viewMode === "day") stepDate(1)
    else if (viewMode === "week") stepDate(7)
    else stepMonth(1)
  }, [isAtMax, viewMode, stepDate, stepMonth])

  const goToday = useCallback(() => {
    const now = new Date()
    setYear(now.getFullYear())
    setMonth(now.getMonth())
    setSelected({
      year: now.getFullYear(),
      month: now.getMonth(),
      day: now.getDate(),
    })
  }, [])

  const handleAddEvent = (data: {
    kind: EventCategory
    title: string
    date: Date
    description: string
    subject?: string
    durationMinutes?: number
    exam?: string
    examType?: ExamType
  }) => {
    let event: CalendarEvent
    if (data.kind === "study") {
      event = new StudyEvent(
        data.title,
        data.date,
        data.subject ?? "",
        data.durationMinutes ?? 30,
        data.description,
      )
    } else if (data.kind === "exam") {
      event = new ExamEvent(
        data.title,
        data.date,
        data.exam ?? "ENEM",
        data.examType ?? "FA",
        data.description,
      )
    } else {
      event = new AssignmentEvent(
        data.title,
        data.date,
        data.subject ?? "",
        data.description,
      )
    }
    userList.add(event)
    bump()
    setFormOpen(false)
  }

  // Só permite deletar eventos criados pelo usuário. Os eventos da
  // rotação (school_day / special_day gerados automaticamente) não
  // podem ser apagados — eles são regenerados a cada renderização.
  const handleDelete = (id: string) => {
    if (id.startsWith(ROTATION_ID_PREFIX)) return
    userList.removeById(id)
    bump()
  }

  const isSameDate = (
    cell: { year: number; month: number; day: number },
    target: { year: number; month: number; day: number } | null,
  ) =>
    target !== null &&
    cell.year === target.year &&
    cell.month === target.month &&
    cell.day === target.day

  const todayCell = {
    year: today.getFullYear(),
    month: today.getMonth(),
    day: today.getDate(),
  }

  const openNewEvent = useCallback(() => {
    const sel =
      selected ?? {
        year: todayCell.year,
        month: todayCell.month,
        day: todayCell.day,
      }
    setSelected(sel)
    setFormOpen(true)
  }, [selected, todayCell.year, todayCell.month, todayCell.day])

  useKeyboardShortcuts({
    prevMonth: goPrev,
    nextMonth: goNext,
    today: goToday,
    newEvent: openNewEvent,
    search: () => setPaletteOpen(true),
    escape: () => {
      if (detailTarget) setDetailTarget(null)
      else if (paletteOpen) setPaletteOpen(false)
      else if (formOpen) setFormOpen(false)
    },
  })

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <div className="space-y-5">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goPrev}
                  aria-label="Anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goNext}
                  disabled={isAtMax}
                  aria-label="Próximo"
                  title={isAtMax ? "Sem acesso após junho/2026" : "Próximo"}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={goToday}>
                  Hoje
                </Button>
              </div>
              {/* Segmented control Day / Week / Month — estilo Apple Calendar */}
              <div className="inline-flex border border-border rounded-lg p-0.5 bg-secondary/30">
                {(["day", "week", "month"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setViewMode(m)}
                    className={cn(
                      "px-3 py-1 text-xs rounded-md transition-colors capitalize",
                      viewMode === m
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {m === "day" ? "Dia" : m === "week" ? "Semana" : "Mês"}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setPaletteOpen(true)}
                  title="Buscar evento (⌘K)"
                  className="hidden sm:inline-flex"
                >
                  <Search className="h-4 w-4" />
                  <span className="hidden md:inline">Buscar</span>
                  <kbd className="hidden md:inline border border-border rounded px-1 py-0 text-[9px] uppercase ml-1">
                    ⌘K
                  </kbd>
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setPaletteOpen(true)}
                  className="sm:hidden"
                  aria-label="Buscar"
                >
                  <Search className="h-4 w-4" />
                </Button>
                <Button size="sm" onClick={openNewEvent}>
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Novo evento</span>
                </Button>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-border/40">
              <CategoryFilter
                active={activeCats}
                onToggle={toggleCat}
                counts={counts}
              />
            </div>
          </CardHeader>
          <CardContent>
            {viewMode === "day" && (
              <DayView
                list={filteredList}
                year={selected?.year ?? year}
                month={selected?.month ?? month}
                day={selected?.day ?? todayCell.day}
                onEntryClick={(entry: TimedEntry) =>
                  setDetailTarget({
                    title: entry.title,
                    startMinutes: entry.startMin,
                    endMinutes: entry.endMin,
                    source: entry.source,
                  })
                }
                onAllDayClick={(entry: AllDayEntry) =>
                  setDetailTarget({
                    title: entry.title,
                    source: entry.source,
                  })
                }
              />
            )}

            {viewMode === "week" && (
              <WeekView
                list={filteredList}
                year={selected?.year ?? year}
                month={selected?.month ?? month}
                day={selected?.day ?? todayCell.day}
                onPickDay={(y, m, d) => {
                  if (isAfterMax(y, m, d)) return // bloqueado pelo cap
                  setYear(y)
                  setMonth(m)
                  setSelected({ year: y, month: m, day: d })
                  setViewMode("day")
                }}
                onEntryClick={(entry: TimedEntry) =>
                  setDetailTarget({
                    title: entry.title,
                    startMinutes: entry.startMin,
                    endMinutes: entry.endMin,
                    source: entry.source,
                  })
                }
                onAllDayClick={(entry: AllDayEntry) =>
                  setDetailTarget({
                    title: entry.title,
                    source: entry.source,
                  })
                }
              />
            )}

            {viewMode === "month" && (
              <>
                <div className="text-xl font-display font-bold mb-3">
                  {CalendarGrid.monthName(month)} {year}
                </div>
                <div className="grid grid-cols-7 mb-2">
                  {CalendarGrid.weekdayHeaders().map((h) => (
                    <div
                      key={h}
                      className="text-[11px] uppercase tracking-wider text-muted-foreground text-center py-1"
                    >
                      {h}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {grid.getCells().flatMap((row, r) =>
                    row.map((cell, c) => {
                      const key = EventScheduler.dayKey(
                        cell.year,
                        cell.month,
                        cell.day,
                      )
                      const dayEvents = byDay.get(key)
                      const evCount = dayEvents?.size() ?? 0
                      const isToday =
                        cell.year === todayCell.year &&
                        cell.month === todayCell.month &&
                        cell.day === todayCell.day
                      const isSel = isSameDate(cell, selected)
                      const isLocked = isAfterMax(
                        cell.year,
                        cell.month,
                        cell.day,
                      )
                      return (
                        <button
                          key={`${r}-${c}`}
                          disabled={isLocked}
                          onClick={() => {
                            if (isLocked) return
                            // Apple-Calendar style: clicar num dia abre a Day view.
                            setYear(cell.year)
                            setMonth(cell.month)
                            setSelected({
                              year: cell.year,
                              month: cell.month,
                              day: cell.day,
                            })
                            setViewMode("day")
                          }}
                          title={isLocked ? "Sem acesso após junho/2026" : undefined}
                          className={cn(
                            "h-20 sm:h-24 rounded-lg border text-left p-1.5 flex flex-col gap-1 transition-all",
                            cell.inMonth
                              ? "bg-card hover:bg-secondary/50 border-border/60"
                              : "bg-secondary/20 text-muted-foreground/60 border-border/30",
                            isToday &&
                              "ring-1 ring-accent border-accent/60 shadow-[0_0_24px_-4px_hsl(var(--accent)/0.5)]",
                            isSel && "bg-accent/10 border-accent",
                            isLocked &&
                              "opacity-40 cursor-not-allowed bg-transparent border-dashed",
                          )}
                        >
                          <span
                            className={cn(
                              "text-xs font-medium",
                              isToday && "text-accent",
                            )}
                          >
                            {cell.day}
                          </span>
                          {dayEvents && evCount > 0 && (
                            <div className="flex flex-col gap-0.5 overflow-hidden">
                              {dayEvents
                                .toArray()
                                .slice(0, 2)
                                .map((ev) => (
                                  <span
                                    key={ev.getId()}
                                    className={cn(
                                      "text-[10px] px-1 py-0.5 rounded border truncate",
                                      ev.getColor(),
                                    )}
                                    title={ev.toString()}
                                  >
                                    <span className="mr-1">{ev.getIcon()}</span>
                                    {ev.getTitle()}
                                  </span>
                                ))}
                              {evCount > 2 && (
                                <span className="text-[10px] text-muted-foreground">
                                  +{evCount - 2}
                                </span>
                              )}
                            </div>
                          )}
                        </button>
                      )
                    }),
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-5">
        {academicMinutes > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Insights</CardTitle>
              <CardDescription>
                Agregação automática (Unit 4 — traverse).
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm space-y-1.5">
              <p>
                <span className="font-semibold text-blue-400 tabular-nums">
                  {Math.floor(academicMinutes / 60)}h{" "}
                  {String(academicMinutes % 60).padStart(2, "0")}
                </span>{" "}
                <span className="text-muted-foreground">
                  de aulas acadêmicas no total
                </span>
              </p>
              {next && (
                <p className="text-xs text-muted-foreground">
                  Próximo:{" "}
                  <span className="text-foreground">{next.getTitle()}</span> em{" "}
                  {next
                    .getDate()
                    .toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                    })}
                </p>
              )}
              {filteredList.size() < list.size() && (
                <p className="text-xs text-amber-400">
                  Filtro ativo: {filteredList.size()} de {list.size()} eventos
                  visíveis
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Resumo</CardTitle>
            <CardDescription>
              Total: {list.size()} evento{list.size() === 1 ? "" : "s"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Stat
              label="Estudo"
              icon="📖"
              value={counts.study}
              color="text-emerald-600 dark:text-emerald-400"
            />
            <Stat
              label="Provas"
              icon="📝"
              value={counts.exam}
              color="text-rose-600 dark:text-rose-400"
            />
            <Stat
              label="Tarefas"
              icon="📌"
              value={counts.assignment}
              color="text-amber-600 dark:text-amber-400"
            />
            <Stat
              label="Dias letivos"
              icon="🏫"
              value={counts.school_day}
              color="text-blue-600 dark:text-blue-400"
            />
            <Stat
              label="Eventos especiais"
              icon="🎉"
              value={counts.special_day}
              color="text-violet-600 dark:text-violet-400"
            />
            {next && (
              <div className="mt-3 pt-3 border-t border-border/50">
                <p className="text-xs text-muted-foreground mb-1">
                  Próximo evento
                </p>
                <div
                  className={cn(
                    "text-xs px-2 py-1.5 rounded border",
                    next.getColor(),
                  )}
                >
                  <span className="mr-1">{next.getIcon()}</span>
                  {next.getTitle()} —{" "}
                  {next.getDate().toLocaleDateString("pt-BR")}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {formOpen && (
        <EventForm
          initialDate={
            selected
              ? new Date(selected.year, selected.month, selected.day, 9, 0)
              : new Date()
          }
          existingList={list}
          onCancel={() => setFormOpen(false)}
          onSubmit={handleAddEvent}
        />
      )}

      {paletteOpen && (
        <CommandPalette
          list={list}
          onPick={(ev) => {
            const d = ev.getDate()
            setYear(d.getFullYear())
            setMonth(d.getMonth())
            setSelected({
              year: d.getFullYear(),
              month: d.getMonth(),
              day: d.getDate(),
            })
            setPaletteOpen(false)
          }}
          onClose={() => setPaletteOpen(false)}
        />
      )}

      {detailTarget && (
        <EventDetailModal
          target={detailTarget}
          onClose={() => setDetailTarget(null)}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// Componentes auxiliares locais
// ─────────────────────────────────────────────

function Stat({
  label,
  icon,
  value,
  color,
}: {
  label: string
  icon: string
  value: number
  color: string
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2">
        <span>{icon}</span>
        <span className="text-foreground/80">{label}</span>
      </span>
      <span className={cn("font-semibold tabular-nums", color)}>{value}</span>
    </div>
  )
}

function EventCard({
  event,
  onDelete,
}: {
  event: CalendarEvent
  onDelete: () => void
}) {
  // Eventos da rotação são gerados automaticamente — não dá pra deletar.
  const canDelete = !event.getId().startsWith(ROTATION_ID_PREFIX)

  let detail: string | null = null
  if (isStudyEvent(event)) {
    detail = `${event.getSubject() || "Estudo"} · ${event.getDurationMinutes()} min`
  } else if (isExamEvent(event)) {
    detail = `Prova: ${event.getExam()}`
  } else if (isAssignmentEvent(event)) {
    detail = `Matéria: ${event.getSubject() || "—"}`
  } else if (isSchoolDayEvent(event)) {
    detail = `Rotação Concept SP · ${event.countAcademicPeriods()} aulas acadêmicas`
  } else if (isSpecialDayEvent(event)) {
    detail = `Evento institucional · ${event.getKind()}`
  }

  return (
    <div
      className={cn(
        "rounded-lg border p-3 flex items-start justify-between gap-3",
        event.getColor(),
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="font-medium text-sm flex items-center gap-1.5">
          <span>{event.getIcon()}</span>
          <span className="truncate">{event.getTitle()}</span>
        </div>
        {detail && <p className="text-xs opacity-80 mt-0.5">{detail}</p>}
        {isSchoolDayEvent(event) && (
          <ul className="mt-2 space-y-0.5 text-xs">
            {event.getPeriods().map((p) => (
              <li
                key={p.getIndex()}
                className={cn(
                  "flex items-center gap-2",
                  p.isAcademic() ? "" : "opacity-60 italic",
                )}
              >
                <span className="font-mono tabular-nums opacity-70 w-24 shrink-0">
                  {p.getStartLabel()}–{p.getEndLabel()}
                </span>
                <span className="truncate">{p.getSubject()}</span>
              </li>
            ))}
          </ul>
        )}
        {event.getDescription() && !isSchoolDayEvent(event) && (
          <p className="text-xs opacity-80 mt-1 whitespace-pre-wrap">
            {event.getDescription()}
          </p>
        )}
        <p className="text-[10px] opacity-60 mt-2 flex items-center gap-1">
          <Code2 className="h-3 w-3" />
          {event.constructor.name}
        </p>
      </div>
      {canDelete && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={onDelete}
          aria-label="Remover evento"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  )
}
