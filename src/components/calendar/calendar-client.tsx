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
  Grid3x3,
  Activity,
  Clock,
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
  type EventCategory,
  type SerializedEvent,
} from "@/lib/calendar"
import { EventForm } from "@/components/calendar/event-form"
import { CategoryFilter } from "@/components/calendar/category-filter"
import { CommandPalette } from "@/components/calendar/command-palette"
import { HeatmapView } from "@/components/calendar/heatmap-view"
import {
  TimelineView,
  totalAcademicMinutes,
} from "@/components/calendar/timeline-view"
import { useKeyboardShortcuts } from "@/lib/use-keyboard-shortcuts"

type ViewMode = "month" | "heatmap"
type DayMode = "list" | "timeline"
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
  const [viewMode, setViewMode] = useState<ViewMode>("month")
  const [dayMode, setDayMode] = useState<DayMode>("list")
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

  const goPrevMonth = useCallback(() => {
    if (month === 0) {
      setYear((y) => y - 1)
      setMonth(11)
    } else {
      setMonth((m) => m - 1)
    }
  }, [month])

  const goNextMonth = useCallback(() => {
    if (month === 11) {
      setYear((y) => y + 1)
      setMonth(0)
    } else {
      setMonth((m) => m + 1)
    }
  }, [month])

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

  const selectedEvents = selected
    ? list.filterByDate(selected.year, selected.month, selected.day)
    : null

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
    prevMonth: goPrevMonth,
    nextMonth: goNextMonth,
    today: goToday,
    newEvent: openNewEvent,
    search: () => setPaletteOpen(true),
    escape: () => {
      if (paletteOpen) setPaletteOpen(false)
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
                  onClick={goPrevMonth}
                  aria-label="Mês anterior"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={goNextMonth}
                  aria-label="Próximo mês"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={goToday}>
                  Hoje
                </Button>
              </div>
              <CardTitle className="text-xl font-display">
                {CalendarGrid.monthName(month)} {year}
              </CardTitle>
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
                <Button
                  size="sm"
                  variant={viewMode === "heatmap" ? "default" : "outline"}
                  onClick={() =>
                    setViewMode((v) => (v === "month" ? "heatmap" : "month"))
                  }
                  title="Alternar entre grade e heatmap"
                >
                  {viewMode === "month" ? (
                    <>
                      <Activity className="h-4 w-4" />
                      <span className="hidden sm:inline">Heatmap</span>
                    </>
                  ) : (
                    <>
                      <Grid3x3 className="h-4 w-4" />
                      <span className="hidden sm:inline">Grade</span>
                    </>
                  )}
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
            {viewMode === "heatmap" ? (
              <HeatmapView list={filteredList} year={year} month={month} />
            ) : (
              <>
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
                      return (
                        <button
                          key={`${r}-${c}`}
                          onClick={() =>
                            setSelected({
                              year: cell.year,
                              month: cell.month,
                              day: cell.day,
                            })
                          }
                          className={cn(
                            "h-20 sm:h-24 rounded-lg border text-left p-1.5 flex flex-col gap-1 transition-all",
                            cell.inMonth
                              ? "bg-card hover:bg-secondary/50 border-border/60"
                              : "bg-secondary/20 text-muted-foreground/60 border-border/30",
                            isToday &&
                              "ring-1 ring-accent border-accent/60 shadow-[0_0_24px_-4px_hsl(var(--accent)/0.5)]",
                            isSel && "bg-accent/10 border-accent",
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

        {selected && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="text-base">
                    {selected.day} de {CalendarGrid.monthName(selected.month)},{" "}
                    {selected.year}
                  </CardTitle>
                  <CardDescription>
                    {selectedEvents && selectedEvents.size() > 0
                      ? `${selectedEvents.size()} evento${selectedEvents.size() > 1 ? "s" : ""}`
                      : "Nenhum evento neste dia"}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex border border-border rounded-md overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setDayMode("list")}
                      className={cn(
                        "px-2.5 py-1 text-xs flex items-center gap-1.5",
                        dayMode === "list"
                          ? "bg-secondary text-foreground"
                          : "text-muted-foreground hover:bg-secondary/50",
                      )}
                      title="Lista"
                    >
                      <Grid3x3 className="h-3.5 w-3.5" />
                      Lista
                    </button>
                    <button
                      type="button"
                      onClick={() => setDayMode("timeline")}
                      className={cn(
                        "px-2.5 py-1 text-xs flex items-center gap-1.5 border-l border-border",
                        dayMode === "timeline"
                          ? "bg-secondary text-foreground"
                          : "text-muted-foreground hover:bg-secondary/50",
                      )}
                      title="Timeline"
                    >
                      <Clock className="h-3.5 w-3.5" />
                      Timeline
                    </button>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setFormOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {dayMode === "timeline" ? (
                <TimelineView
                  list={filteredList}
                  year={selected.year}
                  month={selected.month}
                  day={selected.day}
                />
              ) : selectedEvents && selectedEvents.size() > 0 ? (
                selectedEvents.toArray().map((ev) => (
                  <EventCard
                    key={ev.getId()}
                    event={ev}
                    onDelete={() => handleDelete(ev.getId())}
                  />
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Clique em "Adicionar" para criar um evento neste dia.
                </p>
              )}
            </CardContent>
          </Card>
        )}
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
