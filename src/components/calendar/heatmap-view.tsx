import { cn } from "@/lib/utils"
import { CalendarGrid, EventScheduler, type EventList } from "@/lib/calendar"

interface HeatmapViewProps {
  list: EventList
  year: number
  month: number
}

export function HeatmapView({ list, year, month }: HeatmapViewProps) {
  const grid = new CalendarGrid(year, month)
  const matrix = EventScheduler.heatmapMatrix(list, grid)
  const max = Math.max(1, EventScheduler.maxInMatrix(matrix))
  const cells = grid.getCells()

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-7">
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
        {cells.flatMap((row, r) =>
          row.map((cell, c) => {
            const count = matrix[r][c]
            const isSpillover = count === -1
            const t = isSpillover ? 0 : Math.min(1, count / max)
            return (
              <div
                key={`${r}-${c}`}
                className={cn(
                  "aspect-square rounded-md border flex flex-col items-center justify-center text-[10px] font-medium transition-colors",
                  isSpillover
                    ? "bg-secondary/10 border-border/20 text-muted-foreground/40"
                    : count === 0
                      ? "bg-secondary/30 border-border/40"
                      : "border-accent/30",
                )}
                style={
                  !isSpillover && count > 0
                    ? {
                        backgroundColor: `hsl(var(--accent) / ${0.12 + t * 0.6})`,
                        color: t > 0.5 ? "hsl(var(--accent-foreground))" : undefined,
                      }
                    : undefined
                }
                title={
                  isSpillover
                    ? `${cell.day} (mês adjacente)`
                    : `${cell.day}/${cell.month + 1}: ${count} evento${count === 1 ? "" : "s"}`
                }
              >
                <span className={cn(isSpillover && "opacity-40")}>{cell.day}</span>
                {!isSpillover && count > 0 && (
                  <span className="tabular-nums opacity-80 mt-0.5">{count}</span>
                )}
              </div>
            )
          }),
        )}
      </div>
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
        <span>menos</span>
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <div
            key={t}
            className="w-4 h-4 rounded-sm border border-border/40"
            style={{
              backgroundColor:
                t === 0
                  ? "hsl(var(--secondary))"
                  : `hsl(var(--accent) / ${0.12 + t * 0.6})`,
            }}
          />
        ))}
        <span>mais</span>
        <span className="ml-auto font-mono">
          max = {max} {max > 0 && `· total ${list.size()}`}
        </span>
      </div>
    </div>
  )
}
