import { CalendarClient } from "@/components/calendar/calendar-client"
import { CalendarDays } from "lucide-react"

export function App() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border/50 h-14 flex items-center px-4 sticky top-0 z-40 bg-background/80 backdrop-blur">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo.jpeg"
              alt="Atenis"
              width={32}
              height={32}
              className="rounded-full ring-1 ring-border/50"
            />
            <div className="flex flex-col leading-tight">
              <span className="font-semibold font-display">Atenis</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Calendário · standalone
              </span>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5 text-accent" />
            <span>Persona José</span>
          </div>
        </div>
      </header>

      <div className="container py-6 sm:py-8 animate-fade-in">
        <div className="max-w-6xl mx-auto space-y-5 sm:space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display">
              Calendário
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1 text-pretty">
              Organize estudos, provas e tarefas. Clique em{" "}
              <strong className="text-foreground">Agenda do José</strong> para
              popular maio/2026 com a rotação Concept SP. A engenharia por
              trás demonstra conceitos de AP Computer Science A.
            </p>
          </div>
          <CalendarClient />
        </div>
      </div>
    </div>
  )
}
