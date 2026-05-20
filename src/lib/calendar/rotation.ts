/**
 * RotationEngine — algoritmo de rotação de 6 dias da Concept SP.
 *
 * Regras:
 *  1) Ciclo de 6 dias: Dia 1 → 2 → 3 → 4 → 5 → 6 → volta pro Dia 1.
 *  2) Sábados e domingos NÃO contam.
 *  3) Eventos especiais (Inter House, FOL, feriados) PAUSAM o ciclo.
 *  4) Após pausa, o próximo dia letivo continua do MESMO ponto.
 *
 * Algoritmo: a partir de uma data âncora conhecida (11/05/2026 = Dia 6),
 * caminha dia a dia até a data alvo, avançando o ciclo a cada dia letivo
 * (não-fim-de-semana, não-especial). Pra dias antes da âncora, caminha
 * pra trás. A complexidade é O(D) onde D = distância em dias da âncora,
 * o que é instantâneo na escala de meses/anos.
 *
 * Conceitos AP CS A:
 *  - Unit 1/2: aritmética inteira, módulo (% 6)
 *  - Unit 4: iteração com while, condição de parada
 *  - Unit 5: utility class de funções estáticas
 *  - Unit 7: parallel arrays (templates por dia do ciclo)
 */

import { Period } from "./Period"
import { SchoolDayEvent, SpecialDayEvent } from "./EventTypes"
import type { CalendarEvent } from "./CalendarEvent"

// ─────────────────────────────────────────────────────────────
// ÂNCORA — ponto de referência conhecido
// ─────────────────────────────────────────────────────────────
export const ANCHOR = {
  year: 2026,
  month: 4, // maio (0-indexed)
  day: 11,
  cycleDay: 6,
} as const

// ─────────────────────────────────────────────────────────────
// LIMITE — calendário não acessa nada DEPOIS dessa data.
// ─────────────────────────────────────────────────────────────
export const MAX_DATE = {
  year: 2026,
  month: 5, // junho (0-indexed)
  day: 30,
} as const

// True se a data está depois do MAX_DATE.
export function isAfterMax(year: number, month: number, day: number): boolean {
  if (year > MAX_DATE.year) return true
  if (year < MAX_DATE.year) return false
  if (month > MAX_DATE.month) return true
  if (month < MAX_DATE.month) return false
  return day > MAX_DATE.day
}

// ─────────────────────────────────────────────────────────────
// EVENTOS ESPECIAIS (pausam o ciclo)
// ─────────────────────────────────────────────────────────────
type SpecialDef = {
  year: number
  month: number // 0-indexed
  day: number
  title: string
  kind: string
  description: string
}

export const SPECIAL_EVENTS: ReadonlyArray<SpecialDef> = [
  {
    year: 2026,
    month: 4,
    day: 8,
    title: "Inter House",
    kind: "Inter House",
    description: "Dia esportivo entre houses da escola.",
  },
  {
    year: 2026,
    month: 4,
    day: 30,
    title: "FOL",
    kind: "FOL",
    description: "Festival of Learning.",
  },
  // Semana de provas SA (Summative Assessment) — 25 a 29/05.
  // Pausam o ciclo da rotação. Cada dia é um "Dia de prova".
  {
    year: 2026,
    month: 4,
    day: 25,
    title: "Prova SA",
    kind: "SA",
    description: "Summative Assessment — semana de provas.",
  },
  {
    year: 2026,
    month: 4,
    day: 26,
    title: "Prova SA",
    kind: "SA",
    description: "Summative Assessment — semana de provas.",
  },
  {
    year: 2026,
    month: 4,
    day: 27,
    title: "Prova SA",
    kind: "SA",
    description: "Summative Assessment — semana de provas.",
  },
  {
    year: 2026,
    month: 4,
    day: 28,
    title: "Prova SA",
    kind: "SA",
    description: "Summative Assessment — semana de provas.",
  },
  {
    year: 2026,
    month: 4,
    day: 29,
    title: "Prova SA",
    kind: "SA",
    description: "Último dia da semana de provas SA.",
  },
  // Férias escolares — 25 a 30 de junho. Pausam o ciclo da rotação.
  {
    year: 2026,
    month: 5,
    day: 25,
    title: "Férias",
    kind: "Férias",
    description: "Início das férias escolares.",
  },
  {
    year: 2026,
    month: 5,
    day: 26,
    title: "Férias",
    kind: "Férias",
    description: "Férias escolares.",
  },
  {
    year: 2026,
    month: 5,
    day: 27,
    title: "Férias",
    kind: "Férias",
    description: "Férias escolares.",
  },
  {
    year: 2026,
    month: 5,
    day: 28,
    title: "Férias",
    kind: "Férias",
    description: "Férias escolares.",
  },
  {
    year: 2026,
    month: 5,
    day: 29,
    title: "Férias",
    kind: "Férias",
    description: "Férias escolares.",
  },
  {
    year: 2026,
    month: 5,
    day: 30,
    title: "Férias",
    kind: "Férias",
    description: "Último dia das férias escolares.",
  },
]

// Conjunto de chaves "Y-M-D" pra lookup O(1).
const SPECIAL_KEYS: ReadonlySet<string> = new Set(
  SPECIAL_EVENTS.map((s) => dayKey(s.year, s.month, s.day)),
)

function dayKey(y: number, m: number, d: number): string {
  return `${y}-${m}-${d}`
}

// ─────────────────────────────────────────────────────────────
// TEMPLATES DOS DIAS DO CICLO
// ─────────────────────────────────────────────────────────────
// Cada Dia tem 3 blocos acadêmicos fixos (P1, P2, P3) — sempre nas mesmas
// posições. O slot adicional (entre Break e P2) é determinado pelo DIA DA
// SEMANA, não pelo número do Dia. Ver DAY_OF_WEEK_SLOT abaixo.
const CYCLE_TEMPLATES: Record<number, ReadonlyArray<string>> = {
  1: ["Inglês", "Biologia", "AP Computer Science"],
  2: ["Matemática", "Português", "AP Seminar"],
  3: ["AP Computer Science", "Inglês", "Química"],
  4: ["AP Seminar", "Matemática", "Português"],
  5: ["Física", "AP Computer Science", "Inglês"],
  6: ["Português", "AP Seminar", "Matemática"],
}

// Slot variável por dia da semana (só existe quando Dia ≠ 3).
// JS: 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb.
const DAY_OF_WEEK_SLOT: Record<number, string> = {
  1: "Projeto",
  2: "Extra de Ciências",
  3: "Mandarim",
  4: "X Block de quinta",
  5: "Educação Física",
}

// ─────────────────────────────────────────────────────────────
// HORÁRIOS dos blocos
// ─────────────────────────────────────────────────────────────
const T = (h: number, m: number) => h * 60 + m

// Layout 7 blocos: P1, Advisory, Break, [DOW], P2, Almoço, P3
const SLOTS_7 = [
  { start: T(7, 30), end: T(8, 25) },
  { start: T(8, 25), end: T(8, 40) },
  { start: T(8, 40), end: T(9, 0) },
  { start: T(9, 0), end: T(9, 55) },
  { start: T(9, 55), end: T(10, 50) },
  { start: T(10, 50), end: T(11, 35) },
  { start: T(11, 35), end: T(12, 30) },
]

// ─────────────────────────────────────────────────────────────
// API pública: RotationEngine
// ─────────────────────────────────────────────────────────────
export class RotationEngine {
  // Retorna o número do Dia (1..6) para a data, OU null se a data
  // não é dia letivo (fim de semana ou evento especial).
  public static getCycleDayForDate(
    year: number,
    month: number,
    day: number,
  ): number | null {
    if (RotationEngine.isWeekend(year, month, day)) return null
    if (RotationEngine.isSpecial(year, month, day)) return null

    // Caminha da âncora até a data alvo.
    let cursor = new Date(ANCHOR.year, ANCHOR.month, ANCHOR.day)
    let cycle: number = ANCHOR.cycleDay
    const target = new Date(year, month, day)

    if (cursor.getTime() === target.getTime()) return cycle

    const goingForward = target.getTime() > cursor.getTime()
    const direction = goingForward ? 1 : -1

    if (goingForward) {
      while (true) {
        cursor = new Date(
          cursor.getFullYear(),
          cursor.getMonth(),
          cursor.getDate() + direction,
        )
        const cy = cursor.getFullYear()
        const cm = cursor.getMonth()
        const cd = cursor.getDate()
        const isWeekend = RotationEngine.isWeekend(cy, cm, cd)
        const isSpecial = RotationEngine.isSpecial(cy, cm, cd)

        if (!isWeekend && !isSpecial) {
          cycle = nextCycle(cycle)
        }
        if (cursor.getTime() === target.getTime()) {
          // Já validamos no início que o target não é weekend/special.
          return cycle
        }
      }
    } else {
      while (true) {
        const wasSchoolDay =
          !RotationEngine.isWeekend(
            cursor.getFullYear(),
            cursor.getMonth(),
            cursor.getDate(),
          ) &&
          !RotationEngine.isSpecial(
            cursor.getFullYear(),
            cursor.getMonth(),
            cursor.getDate(),
          )
        cursor = new Date(
          cursor.getFullYear(),
          cursor.getMonth(),
          cursor.getDate() + direction,
        )
        if (wasSchoolDay) cycle = prevCycle(cycle)
        if (cursor.getTime() === target.getTime()) return cycle
      }
    }
  }

  // Dia da semana 0..6 (0=Dom, 6=Sáb).
  public static weekday(year: number, month: number, day: number): number {
    return new Date(year, month, day).getDay()
  }

  public static isWeekend(year: number, month: number, day: number): boolean {
    const w = RotationEngine.weekday(year, month, day)
    return w === 0 || w === 6
  }

  public static isSpecial(year: number, month: number, day: number): boolean {
    return SPECIAL_KEYS.has(dayKey(year, month, day))
  }

  public static getSpecialForDate(
    year: number,
    month: number,
    day: number,
  ): SpecialDef | null {
    for (const s of SPECIAL_EVENTS) {
      if (s.year === year && s.month === month && s.day === day) return s
    }
    return null
  }

  // Constrói o array de Period pra uma data — usado pelo SchoolDayEvent.
  public static periodsForDate(
    year: number,
    month: number,
    day: number,
  ): Period[] {
    const cycle = RotationEngine.getCycleDayForDate(year, month, day)
    if (cycle === null) return []

    const academic = CYCLE_TEMPLATES[cycle]
    const weekday = RotationEngine.weekday(year, month, day)
    const dowSlot = DAY_OF_WEEK_SLOT[weekday] ?? ""

    // Todos os Dias têm 7 blocos com o mesmo layout:
    //   P1, Advisory, Break, [slot do dia da semana], P2, Almoço, P3
    // O slot 4 varia por dia da semana:
    //   Seg → Projeto · Ter → Extra de Ciências · Qua → Mandarim
    //   Qui → X Block de quinta · Sex → Educação Física
    const periods: Period[] = []
    periods.push(new Period(1, academic[0], SLOTS_7[0].start, SLOTS_7[0].end))
    periods.push(new Period(2, "Advisory", SLOTS_7[1].start, SLOTS_7[1].end))
    periods.push(new Period(3, "Break", SLOTS_7[2].start, SLOTS_7[2].end))
    periods.push(new Period(4, dowSlot, SLOTS_7[3].start, SLOTS_7[3].end))
    periods.push(new Period(5, academic[1], SLOTS_7[4].start, SLOTS_7[4].end))
    periods.push(new Period(6, "Almoço", SLOTS_7[5].start, SLOTS_7[5].end))
    periods.push(new Period(7, academic[2], SLOTS_7[6].start, SLOTS_7[6].end))
    return periods
  }

  // Gera TODOS os eventos (school + special) que caem dentro de um mês.
  // Usa um id determinístico baseado na data — assim re-gerar não cria
  // duplicatas, e o estado é estável entre reloads.
  public static generateForMonth(
    year: number,
    month: number,
  ): CalendarEvent[] {
    const out: CalendarEvent[] = []
    const days = new Date(year, month + 1, 0).getDate()

    for (let day = 1; day <= days; day++) {
      // Special day?
      const special = RotationEngine.getSpecialForDate(year, month, day)
      if (special) {
        const date = new Date(year, month, day, 8, 0)
        const ev = new SpecialDayEvent(
          special.title,
          date,
          special.kind,
          special.description,
          stableId("special", year, month, day),
        )
        out.push(ev)
        continue
      }

      // Dia letivo normal?
      const cycle = RotationEngine.getCycleDayForDate(year, month, day)
      if (cycle === null) continue // fim de semana

      const periods = RotationEngine.periodsForDate(year, month, day)
      const academicCount = periods.filter((p) => p.isAcademic()).length
      const startMin = periods[0]?.getStartMinutes() ?? 7 * 60 + 30
      const date = new Date(
        year,
        month,
        day,
        Math.floor(startMin / 60),
        startMin % 60,
      )
      out.push(
        new SchoolDayEvent(
          `Dia ${cycle}`,
          date,
          cycle,
          periods,
          `${academicCount} aulas acadêmicas · rotação Concept SP`,
          stableId("day", year, month, day),
        ),
      )
    }

    return out
  }
}

// ─────────────────────────────────────────────────────────────
// helpers privados
// ─────────────────────────────────────────────────────────────
function nextCycle(c: number): number {
  return (c % 6) + 1 // 1→2..5→6, 6→1
}
function prevCycle(c: number): number {
  return c === 1 ? 6 : c - 1
}

// Id determinístico — mesmo evento da mesma data sempre tem o mesmo id.
// Útil pra deduplicar quando regenerar (evita duplicatas no localStorage).
function stableId(prefix: string, y: number, m: number, d: number): string {
  return `rot_${prefix}_${y}_${m}_${d}`
}

// Prefixo dos ids gerados pela rotação — usado pelo CalendarClient
// pra distinguir eventos da rotação dos eventos criados pelo usuário.
export const ROTATION_ID_PREFIX = "rot_"
