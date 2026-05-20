import { CalendarClient } from "@/components/calendar/calendar-client"
import { CalendarDays } from "lucide-react"

export function App() {
  return (
    <div className="min-h-screen safe-area">
      <header className="border-b border-border/50 h-14 flex items-center px-3 sm:px-4 sticky top-0 z-40 bg-background/80 backdrop-blur">
        <div className="container flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <img
              src="/logo.jpeg"
              alt="Atenis"
              width={32}
              height={32}
              className="rounded-full ring-1 ring-border/50 shrink-0"
            />
            <div className="flex flex-col leading-tight min-w-0">
              <span className="font-semibold font-display truncate">Atenis</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">
                Calendário · standalone
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
            <CalendarDays className="h-3.5 w-3.5 text-accent" />
            <span className="hidden xs:inline">Persona José</span>
          </div>
        </div>
      </header>

      <div className="container py-4 sm:py-6 lg:py-8 animate-fade-in">
        <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold font-display">
              Calendário
            </h1>
            <p className="text-xs sm:text-sm lg:text-base text-muted-foreground mt-1 text-pretty">
              Organize estudos, provas e tarefas. A rotação Concept SP de
              6 dias aparece automaticamente — pula fins de semana e
              pausa em eventos como Inter House e FOL.
            </p>
          </div>
          <CalendarClient />
        </div>
      </div>
    </div>
  )
}
