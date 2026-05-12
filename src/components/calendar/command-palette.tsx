import { useEffect, useMemo, useRef, useState } from "react"
import { Search, ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  type CalendarEvent,
  EventList,
  isStudyEvent,
  isExamEvent,
  isAssignmentEvent,
  isSchoolDayEvent,
  isSpecialDayEvent,
} from "@/lib/calendar"

interface CommandPaletteProps {
  list: EventList
  onPick: (ev: CalendarEvent) => void
  onClose: () => void
}

function detailFor(ev: CalendarEvent): string {
  if (isStudyEvent(ev)) return `${ev.getSubject() || "Estudo"} · ${ev.getDurationMinutes()} min`
  if (isExamEvent(ev)) return `Prova: ${ev.getExam()}`
  if (isAssignmentEvent(ev)) return `Tarefa · ${ev.getSubject() || "—"}`
  if (isSchoolDayEvent(ev)) return `Dia letivo · cycle ${ev.getDayCycle()}`
  if (isSpecialDayEvent(ev)) return `Evento · ${ev.getKind()}`
  return ""
}

export function CommandPalette({ list, onPick, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("")
  const [activeIdx, setActiveIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Lista ORDENADA por título (Insertion Sort) — pré-condição do BS.
  const sortedByTitle = useMemo(() => list.sortedByTitle(), [list])

  // Match exato via Binary Search (O(log n)).
  const exactBSIndex = useMemo(() => {
    if (!query.trim()) return -1
    const sortedList = new EventList(sortedByTitle)
    return sortedList.binarySearchByTitle(query)
  }, [sortedByTitle, query])
  const exactMatch = exactBSIndex >= 0 ? sortedByTitle[exactBSIndex] : null

  // Filtro substring linear — resultados visíveis pro usuário.
  const linearMatches = useMemo(() => {
    if (!query.trim()) return sortedByTitle.slice(0, 8)
    return list.linearFilterByTitle(query).slice(0, 12)
  }, [list, query, sortedByTitle])

  useEffect(() => {
    setActiveIdx(0)
  }, [query])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIdx((i) => Math.min(i + 1, linearMatches.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIdx((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter") {
      e.preventDefault()
      const pick = linearMatches[activeIdx]
      if (pick) onPick(pick)
    } else if (e.key === "Escape") {
      e.preventDefault()
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-start justify-center pt-[15vh] px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-xl border border-border bg-card shadow-2xl overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/60">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar evento por título…"
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
          />
          <kbd className="hidden sm:inline-flex text-[10px] uppercase tracking-wider text-muted-foreground border border-border rounded px-1.5 py-0.5">
            esc
          </kbd>
        </div>

        {exactMatch && (
          <div className="px-4 py-2 text-[11px] text-emerald-500 border-b border-border/40 bg-emerald-500/5 flex items-center gap-2">
            <span className="font-mono">binarySearchByTitle</span>
            <span className="opacity-70">→ índice {exactBSIndex} de {sortedByTitle.length}</span>
            <span className="opacity-50">(O(log n))</span>
          </div>
        )}

        <ul className="max-h-[50vh] overflow-y-auto">
          {linearMatches.length === 0 ? (
            <li className="px-4 py-6 text-sm text-muted-foreground text-center">
              {query.trim()
                ? `Nenhum evento contém "${query}".`
                : "Comece a digitar pra buscar."}
            </li>
          ) : (
            linearMatches.map((ev, i) => (
              <li key={ev.getId()}>
                <button
                  type="button"
                  className={cn(
                    "w-full text-left px-4 py-2.5 flex items-center gap-3 text-sm border-l-2",
                    i === activeIdx
                      ? "bg-secondary border-l-accent"
                      : "border-l-transparent hover:bg-secondary/50",
                  )}
                  onMouseEnter={() => setActiveIdx(i)}
                  onClick={() => onPick(ev)}
                >
                  <span className="text-base shrink-0">{ev.getIcon()}</span>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">
                      {ev.getTitle()}
                      {exactMatch && exactMatch.getId() === ev.getId() && (
                        <span className="ml-2 text-[10px] text-emerald-500 uppercase tracking-wider">
                          BS exact
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {detailFor(ev)} ·{" "}
                      {ev.getDate().toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </li>
            ))
          )}
        </ul>

        <div className="px-4 py-2 border-t border-border/60 text-[10px] text-muted-foreground flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="border border-border rounded px-1">↑</kbd>{" "}
              <kbd className="border border-border rounded px-1">↓</kbd> navegar
            </span>
            <span>
              <kbd className="border border-border rounded px-1">↵</kbd> abrir
            </span>
          </div>
          <span>
            {linearMatches.length} de {list.size()} eventos · linear search
          </span>
        </div>
      </div>
    </div>
  )
}
