/**
 * Agenda escolar da persona "José" (Concept SP — rotação de 6 dias).
 *
 * Conceitos AP CS A:
 *  - Unit 7 (ArrayList / Arrays): a agenda é um array de definições
 *    de dia, e cada definição contém um array de matérias.
 *  - Unit 4 (Iteration): buildJoseSchedule() faz traverse na agenda e
 *    em cada conjunto de períodos, instanciando Period e
 *    SchoolDayEvent — um padrão clássico de "data → objetos".
 *  - Padrão Builder: a função buildJoseSchedule() concentra a
 *    construção, deixando os dados crus (DAYS) limpos.
 */

import { Period } from "./Period"
import { CalendarEvent } from "./CalendarEvent"
import { SchoolDayEvent, SpecialDayEvent } from "./EventTypes"

// Tradução de dias-da-semana → minutos. Aritmética inteira: H * 60 + M.
const T = (h: number, m: number): number => h * 60 + m

// Layout de horários para um dia com 7 blocos.
// Sequência observada na agenda: P1, Advisory, Break, P2, P3, Almoço, P4.
const SLOTS_7: ReadonlyArray<{ start: number; end: number }> = [
  { start: T(7, 30), end: T(8, 25) }, // 1
  { start: T(8, 25), end: T(8, 40) }, // 2 (Advisory)
  { start: T(8, 40), end: T(9, 0) }, // 3 (Break)
  { start: T(9, 0), end: T(9, 55) }, // 4
  { start: T(9, 55), end: T(10, 50) }, // 5
  { start: T(10, 50), end: T(11, 35) }, // 6 (Almoço)
  { start: T(11, 35), end: T(12, 30) }, // 7
]

// Layout de horários para dias com 6 blocos (ex.: Dia 3 da agenda).
// Sequência: P1, Advisory, Break, P2, Almoço, P3.
const SLOTS_6: ReadonlyArray<{ start: number; end: number }> = [
  { start: T(7, 30), end: T(8, 25) }, // 1
  { start: T(8, 25), end: T(8, 40) }, // 2 (Advisory)
  { start: T(8, 40), end: T(9, 0) }, // 3 (Break)
  { start: T(9, 0), end: T(9, 55) }, // 4
  { start: T(9, 55), end: T(10, 35) }, // 5 (Almoço)
  { start: T(10, 35), end: T(11, 30) }, // 6
]

type DayDefinition = {
  date: string // YYYY-MM-DD
  cycle: number // 1..6
  periods: string[] // tamanho 6 ou 7
}

// Os dados crus, exatamente como o produto registrou.
export const JOSE_SCHEDULE: ReadonlyArray<DayDefinition> = [
  {
    date: "2026-05-11",
    cycle: 6,
    periods: ["Português", "Advisory", "Break", "Projeto", "AP Seminar", "Almoço", "Matemática"],
  },
  {
    date: "2026-05-12",
    cycle: 1,
    periods: ["Inglês", "Advisory", "Break", "Extra de Ciências", "Biologia", "Almoço", "AP Computer Science"],
  },
  {
    date: "2026-05-13",
    cycle: 2,
    periods: ["Matemática", "Advisory", "Break", "Francês", "Português", "Almoço", "AP Seminar"],
  },
  {
    date: "2026-05-14",
    cycle: 3,
    periods: ["AP Computer Science", "Advisory", "Break", "Inglês", "Almoço", "Química"],
  },
  {
    date: "2026-05-15",
    cycle: 4,
    periods: ["AP Seminar", "Advisory", "Break", "Educação Física", "Matemática", "Almoço", "Português"],
  },
  {
    date: "2026-05-18",
    cycle: 5,
    periods: ["Física", "Advisory", "Break", "Projeto", "AP Computer Science", "Almoço", "Inglês"],
  },
  {
    date: "2026-05-19",
    cycle: 6,
    periods: ["Português", "Advisory", "Break", "Extra de Ciências", "AP Seminar", "Almoço", "Matemática"],
  },
  {
    date: "2026-05-20",
    cycle: 1,
    periods: ["Inglês", "Advisory", "Break", "Francês", "Biologia", "Almoço", "AP Computer Science"],
  },
  {
    date: "2026-05-21",
    cycle: 2,
    periods: ["Matemática", "Advisory", "Break", "X Block de quinta", "Português", "Almoço", "AP Seminar"],
  },
  {
    date: "2026-05-22",
    cycle: 3,
    periods: ["AP Computer Science", "Advisory", "Break", "Inglês", "Almoço", "Química"],
  },
  {
    date: "2026-05-25",
    cycle: 4,
    periods: ["AP Seminar", "Advisory", "Break", "Projeto", "Matemática", "Almoço", "Português"],
  },
  {
    date: "2026-05-26",
    cycle: 5,
    periods: ["Física", "Advisory", "Break", "Extra de Ciências", "AP Computer Science", "Almoço", "Inglês"],
  },
  {
    date: "2026-05-27",
    cycle: 6,
    periods: ["Português", "Advisory", "Break", "Francês", "AP Seminar", "Almoço", "Matemática"],
  },
  {
    date: "2026-05-28",
    cycle: 1,
    periods: ["Inglês", "Advisory", "Break", "X Block de quinta", "Biologia", "Almoço", "AP Computer Science"],
  },
  {
    date: "2026-05-29",
    cycle: 2,
    periods: ["Matemática", "Advisory", "Break", "Educação Física", "Português", "Almoço", "AP Seminar"],
  },
]

// Builder: data → SchoolDayEvent[].
// Cada dia vira UM SchoolDayEvent contendo N Period.
// Dias especiais (sem rotação, sem grade de aulas): Inter House, FOL, etc.
type SpecialDayDefinition = {
  date: string // YYYY-MM-DD
  title: string // Inter House, FOL, ...
  description?: string
}

export const JOSE_SPECIAL_DAYS: ReadonlyArray<SpecialDayDefinition> = [
  {
    date: "2026-05-08",
    title: "Inter House",
    description: "Competição entre houses da Concept SP.",
  },
  {
    date: "2026-05-30",
    title: "FOL",
    description: "Festival/evento institucional (FOL).",
  },
]

// Builder único: devolve a lista heterogênea de eventos da agenda do José.
// Inclui SchoolDayEvent (15 dias letivos) + SpecialDayEvent (Inter House, FOL).
export function buildJoseSchedule(): CalendarEvent[] {
  const events: CalendarEvent[] = []

  // Dias letivos regulares.
  for (const day of JOSE_SCHEDULE) {
    const slots = day.periods.length === 7 ? SLOTS_7 : SLOTS_6
    if (day.periods.length !== slots.length) {
      // Defensivo: ignora dias com formato inesperado.
      continue
    }

    // Unit 4 (Iteration): traverse para criar Period a partir de
    // duas listas paralelas (matérias × slots de horário).
    const periods: Period[] = []
    for (let i = 0; i < day.periods.length; i++) {
      const slot = slots[i]
      periods.push(new Period(i + 1, day.periods[i], slot.start, slot.end))
    }

    // Parse "YYYY-MM-DD" sem cair em fuso UTC.
    const [yStr, mStr, dStr] = day.date.split("-")
    const y = Number(yStr)
    const m = Number(mStr) - 1
    const d = Number(dStr)
    const startMin = slots[0].start
    const date = new Date(y, m, d, Math.floor(startMin / 60), startMin % 60)

    // Resumo curto que vai aparecer na descrição do evento.
    const academicCount = periods.filter((p) => p.isAcademic()).length
    const description = `${academicCount} aulas acadêmicas. Rotação Concept SP.`

    events.push(
      new SchoolDayEvent(`Dia ${day.cycle}`, date, day.cycle, periods, description),
    )
  }

  // Dias especiais (Inter House / FOL).
  for (const sp of JOSE_SPECIAL_DAYS) {
    const [yStr, mStr, dStr] = sp.date.split("-")
    const y = Number(yStr)
    const m = Number(mStr) - 1
    const d = Number(dStr)
    // Marca às 07:30 — começo padrão de evento escolar do dia.
    const date = new Date(y, m, d, 7, 30)
    events.push(
      new SpecialDayEvent(sp.title, date, sp.title, sp.description ?? ""),
    )
  }

  return events
}

// Conjunto das datas (em formato YYYY-M-D zero-indexado) que a agenda
// cobre. Usado para deduplicação ao recarregar.
// Inclui dias letivos E dias especiais.
export function getJoseScheduleDateKeys(): Set<string> {
  const out = new Set<string>()
  for (const sp of JOSE_SPECIAL_DAYS) {
    const [yStr, mStr, dStr] = sp.date.split("-")
    const y = Number(yStr)
    const m = Number(mStr) - 1
    const d = Number(dStr)
    out.add(`${y}-${m}-${d}`)
  }
  for (const day of JOSE_SCHEDULE) {
    const [yStr, mStr, dStr] = day.date.split("-")
    const y = Number(yStr)
    const m = Number(mStr) - 1
    const d = Number(dStr)
    out.add(`${y}-${m}-${d}`)
  }
  return out
}
