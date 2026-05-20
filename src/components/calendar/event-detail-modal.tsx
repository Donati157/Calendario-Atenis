import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Trash2, X, Clock, Calendar as CalendarIcon } from "lucide-react"
import {
  type CalendarEvent,
  isStudyEvent,
  isExamEvent,
  isAssignmentEvent,
  isSchoolDayEvent,
  isSpecialDayEvent,
  ROTATION_ID_PREFIX,
} from "@/lib/calendar"

interface DetailTarget {
  // O evento que originou o click (pode ser uma "entrada" do DayView).
  // Title e startMin/endMin podem diferir do evento-fonte (ex.: clicando
  // num período de SchoolDayEvent).
  title: string
  startMinutes?: number // 0..1440 (minutos desde 00:00)
  endMinutes?: number
  // Evento real subjacente — usado pra ler metadados e deletar.
  source: CalendarEvent
}

interface EventDetailModalProps {
  target: DetailTarget
  onClose: () => void
  onDelete?: (id: string) => void
}

const WEEKDAY_NAMES = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
]

const MONTH_NAMES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
]

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`
}

function fmtTimeFromMinutes(min: number): string {
  return `${pad(Math.floor(min / 60))}:${pad(min % 60)}`
}

export function EventDetailModal({
  target,
  onClose,
  onDelete,
}: EventDetailModalProps) {
  const ev = target.source
  const date = ev.getDate()
  const dateLabel = `${date.getDate()} de ${MONTH_NAMES[date.getMonth()]} de ${date.getFullYear()}`
  const weekday = WEEKDAY_NAMES[date.getDay()]

  // Horário: usa minutos passados (mais preciso, vem do click no Period)
  // ou cai no horário do evento + duração.
  const startMin =
    target.startMinutes ?? date.getHours() * 60 + date.getMinutes()
  const endMin = target.endMinutes ?? startMin + Math.max(0, ev.getDurationMinutes())
  const timeLabel =
    endMin > startMin
      ? `${fmtTimeFromMinutes(startMin)} – ${fmtTimeFromMinutes(endMin)}`
      : `${fmtTimeFromMinutes(startMin)}`

  // Subtítulo descritivo da subclass (polimorfismo + type guards).
  let subtitle: string | null = null
  if (isStudyEvent(ev)) {
    subtitle = `Estudo · ${ev.getSubject() || "—"} · ${ev.getDurationMinutes()} min`
  } else if (isExamEvent(ev)) {
    subtitle = `Prova ${ev.getExamType()} · ${ev.getExam()}`
  } else if (isAssignmentEvent(ev)) {
    subtitle = `Tarefa · ${ev.getSubject() || "—"}`
  } else if (isSchoolDayEvent(ev)) {
    subtitle = `Dia letivo · Dia ${ev.getDayCycle()} da rotação`
  } else if (isSpecialDayEvent(ev)) {
    subtitle = `Evento institucional · ${ev.getKind()}`
  }

  const canDelete =
    onDelete !== undefined && !ev.getId().startsWith(ROTATION_ID_PREFIX)

  return (
    <div
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="pb-3 relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 h-7 w-7"
            onClick={onClose}
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </Button>
          <div
            className={cn(
              "inline-flex items-center gap-2 px-2 py-1 rounded-md border text-xs w-fit",
              ev.getColor(),
            )}
          >
            <span>{ev.getIcon()}</span>
            <span className="capitalize">{ev.getCategory().replace("_", " ")}</span>
          </div>
          <CardTitle className="text-xl pt-1 pr-8">{target.title}</CardTitle>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <CalendarIcon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <div>
              <div className="font-medium">{dateLabel}</div>
              <div className="text-xs text-muted-foreground">{weekday}</div>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Clock className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
            <div>
              <div className="font-mono tabular-nums">{timeLabel}</div>
              {endMin > startMin && (
                <div className="text-xs text-muted-foreground">
                  {endMin - startMin} minutos
                </div>
              )}
            </div>
          </div>

          {ev.getDescription() && (
            <div className="pt-2 border-t border-border/40">
              <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                {ev.getDescription()}
              </p>
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-border/40">
            <span className="text-[10px] font-mono text-muted-foreground">
              {ev.constructor.name}
            </span>
            {canDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onDelete!(ev.getId())
                  onClose()
                }}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Remover
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export type { DetailTarget }
