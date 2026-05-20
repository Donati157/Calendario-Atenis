/**
 * Subclasses concretas de CalendarEvent.
 *
 * Conceitos de AP CS A:
 *  - Unit 9 (Inheritance): cada classe usa `extends` + `super(...)` no
 *    construtor, e sobrescreve os métodos abstract (getCategory, getColor,
 *    getIcon) → polimorfismo.
 *  - Unit 9: o método toJSON é sobrescrito (override) para incluir os
 *    campos próprios da subclass — chamando super.toJSON() primeiro
 *    (reuso de implementação herdada).
 *  - Padrão Factory (Unit 5/9): eventFromJSON decide qual subclasse
 *    instanciar a partir do campo `kind`, ilustrando como
 *    um polimorfismo de runtime é construído.
 */

import {
  CalendarEvent,
  type EventCategory,
  type SerializedEvent,
} from "./CalendarEvent"
import { Period } from "./Period"

// ──────────────────────────────────────────────────────────
// Sessão de estudo
// ──────────────────────────────────────────────────────────
export class StudyEvent extends CalendarEvent {
  private subject: string
  private durationMinutes: number

  public constructor(
    title: string,
    date: Date,
    subject: string,
    durationMinutes: number,
    description = "",
    id?: string,
  ) {
    // Unit 9: super(...) chama o construtor da superclasse.
    super(title, date, description, id)
    this.subject = subject
    this.durationMinutes = durationMinutes
  }

  public getSubject(): string {
    return this.subject
  }
  // Unit 9: override do default da superclasse (30) com valor real do form.
  public override getDurationMinutes(): number {
    return this.durationMinutes
  }

  // Override (Unit 9): polimorfismo.
  public override getCategory(): EventCategory {
    return "study"
  }
  public override getColor(): string {
    return "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-300"
  }
  public override getIcon(): string {
    return "📖"
  }

  public override toJSON(): SerializedEvent {
    // Unit 9: chama o toJSON herdado e adiciona campos próprios.
    return {
      ...super.toJSON(),
      subject: this.subject,
      durationMinutes: this.durationMinutes,
    }
  }
}

// ──────────────────────────────────────────────────────────
// Prova / exame
// ──────────────────────────────────────────────────────────
// Tipos válidos de prova (regra de negócio: toda prova é FA ou SA).
//   FA = Formative Assessment (avaliação formativa, peso menor)
//   SA = Summative Assessment (avaliação somativa, peso maior)
export type ExamType = "FA" | "SA"

export class ExamEvent extends CalendarEvent {
  // Que prova (ENEM, Fuvest, AP, simulado, etc.)
  private exam: string
  // Toda prova OBRIGATORIAMENTE é FA ou SA.
  private examType: ExamType

  public constructor(
    title: string,
    date: Date,
    exam: string,
    examType: ExamType = "FA",
    description = "",
    id?: string,
  ) {
    super(title, date, description, id)
    this.exam = exam
    this.examType = examType
  }

  public getExam(): string {
    return this.exam
  }
  public getExamType(): ExamType {
    return this.examType
  }

  public override getCategory(): EventCategory {
    return "exam"
  }
  // Cor depende do tipo. SA é mais vermelho (mais peso), FA é mais laranja.
  public override getColor(): string {
    if (this.examType === "SA") {
      return "bg-red-500/15 text-red-700 border-red-500/30 dark:text-red-300"
    }
    return "bg-orange-500/15 text-orange-700 border-orange-500/30 dark:text-orange-300"
  }
  public override getIcon(): string {
    return "📝"
  }
  // Unit 9: prova padrão dura 2h. Override do default de 30 min.
  public override getDurationMinutes(): number {
    return 120
  }

  public override toJSON(): SerializedEvent {
    return {
      ...super.toJSON(),
      exam: this.exam,
      examType: this.examType,
    }
  }
}

// ──────────────────────────────────────────────────────────
// Tarefa / lição de casa
// ──────────────────────────────────────────────────────────
export class AssignmentEvent extends CalendarEvent {
  private subject: string

  public constructor(
    title: string,
    date: Date,
    subject: string,
    description = "",
    id?: string,
  ) {
    super(title, date, description, id)
    this.subject = subject
  }

  public getSubject(): string {
    return this.subject
  }

  public override getCategory(): EventCategory {
    return "assignment"
  }
  public override getColor(): string {
    return "bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-300"
  }
  public override getIcon(): string {
    return "📌"
  }
  // Unit 9: tarefa é um deadline pontual, sem janela de duração.
  public override getDurationMinutes(): number {
    return 0
  }

  public override toJSON(): SerializedEvent {
    return { ...super.toJSON(), subject: this.subject }
  }
}

// ──────────────────────────────────────────────────────────
// Dia letivo completo (composição: contém vários Period)
// ──────────────────────────────────────────────────────────
// Conceitos AP CS A:
//  - Unit 5 (composition): SchoolDayEvent HAS-A array de Period.
//    Diferente de herança (IS-A), composição é "tem um".
//  - Unit 7 (ArrayList-like): mantemos os Period em um array,
//    com defensive copy na entrada e na saída.
//  - Unit 9 (override): overridemos getCategory/getColor/getIcon
//    e estendemos toJSON para serializar os Period internos.
//  - Unit 4 (traverse): getAcademicSubjects faz um filtro com
//    enhanced-for, ignorando intervalos institucionais.
//  - Open/Closed Principle: adicionar este tipo NÃO exigiu mexer
//    em CalendarEvent, EventList nem CalendarGrid — só estender.
export class SchoolDayEvent extends CalendarEvent {
  private readonly dayCycle: number // 1..6 (rotação Concept SP)
  private readonly periods: Period[]

  public constructor(
    title: string,
    date: Date,
    dayCycle: number,
    periods: Period[],
    description = "",
    id?: string,
  ) {
    super(title, date, description, id)
    this.dayCycle = dayCycle
    // Defensive copy: protege o estado interno.
    this.periods = [...periods]
  }

  public getDayCycle(): number {
    return this.dayCycle
  }
  public getPeriods(): Period[] {
    return [...this.periods]
  }

  // Unit 4: traverse + filtro condicional.
  public getAcademicSubjects(): string[] {
    const out: string[] = []
    for (const p of this.periods) {
      if (p.isAcademic()) out.push(p.getSubject())
    }
    return out
  }

  // Unit 4: contagem de aulas reais (sem advisory/break/almoço).
  public countAcademicPeriods(): number {
    let count = 0
    for (const p of this.periods) {
      if (p.isAcademic()) count++
    }
    return count
  }

  public override getCategory(): EventCategory {
    return "school_day"
  }
  public override getColor(): string {
    return "bg-blue-500/15 text-blue-700 border-blue-500/30 dark:text-blue-300"
  }
  public override getIcon(): string {
    return "🏫"
  }
  // Unit 9 + 4: duração total do dia letivo, do início do primeiro
  // bloco até o fim do último.
  public override getDurationMinutes(): number {
    if (this.periods.length === 0) return super.getDurationMinutes()
    const first = this.periods[0]
    const last = this.periods[this.periods.length - 1]
    return last.getEndMinutes() - first.getStartMinutes()
  }

  public override toJSON(): SerializedEvent {
    return {
      ...super.toJSON(),
      dayCycle: this.dayCycle,
      periods: this.periods.map((p) => p.toJSON()),
    }
  }
}

// ──────────────────────────────────────────────────────────
// Dia especial (sem rotação, sem períodos) — eventos de escola
// que não são aula regular: Inter House, FOL, etc.
// ──────────────────────────────────────────────────────────
// Conceitos AP CS A:
//  - Unit 9: herança simples (extends + super + overrides).
//  - Open/Closed Principle: adicionado SEM modificar nenhuma
//    classe existente — só adicionando uma nova subclass.
export class SpecialDayEvent extends CalendarEvent {
  // Tipo do evento (free-form string: "Inter House", "FOL", "Field Trip"...).
  private readonly kind_: string

  public constructor(
    title: string,
    date: Date,
    kind: string,
    description = "",
    id?: string,
  ) {
    super(title, date, description, id)
    this.kind_ = kind
  }

  public getKind(): string {
    return this.kind_
  }

  public override getCategory(): EventCategory {
    return "special_day"
  }
  public override getColor(): string {
    // Cor depende do tipo do dia especial.
    if (this.kind_ === "SA") {
      return "bg-red-500/20 text-red-700 border-red-500/40 dark:text-red-300"
    }
    if (this.kind_ === "FA") {
      return "bg-orange-500/20 text-orange-700 border-orange-500/40 dark:text-orange-300"
    }
    return "bg-violet-500/15 text-violet-700 border-violet-500/30 dark:text-violet-300"
  }
  public override getIcon(): string {
    // Ícone depende do tipo do dia especial.
    if (this.kind_ === "Férias") return "🏖️"
    if (this.kind_ === "SA" || this.kind_ === "FA") return "📝"
    return "🎉"
  }
  // Dia inteiro — 8h aproximadas (ex.: 7:30 às 15:30).
  public override getDurationMinutes(): number {
    return 8 * 60
  }

  public override toJSON(): SerializedEvent {
    return { ...super.toJSON(), specialKind: this.kind_ }
  }
}

// ──────────────────────────────────────────────────────────
// Factory de reidratação (Unit 5 / 9)
// ──────────────────────────────────────────────────────────
// Recebe o JSON serializado e devolve a SUBCLASSE correta.
// Esse "switch sobre o tipo" é a "fronteira" — assim que a instância
// existe, todo o código a frente trabalha pelo tipo abstrato e o
// polimorfismo dinâmico cuida do resto.
export function eventFromJSON(raw: SerializedEvent): CalendarEvent {
  const date = new Date(raw.date)
  switch (raw.kind) {
    case "study":
      return new StudyEvent(
        raw.title,
        date,
        typeof raw.subject === "string" ? raw.subject : "",
        typeof raw.durationMinutes === "number" ? raw.durationMinutes : 30,
        raw.description,
        raw.id,
      )
    case "exam": {
      const et = raw.examType === "SA" ? "SA" : "FA"
      return new ExamEvent(
        raw.title,
        date,
        typeof raw.exam === "string" ? raw.exam : "ENEM",
        et,
        raw.description,
        raw.id,
      )
    }
    case "assignment":
      return new AssignmentEvent(
        raw.title,
        date,
        typeof raw.subject === "string" ? raw.subject : "",
        raw.description,
        raw.id,
      )
    case "school_day": {
      const periodArr = Array.isArray(raw.periods)
        ? (raw.periods as unknown[])
        : []
      return new SchoolDayEvent(
        raw.title,
        date,
        typeof raw.dayCycle === "number" ? raw.dayCycle : 1,
        periodArr.map((p) => Period.fromJSON(p)),
        raw.description,
        raw.id,
      )
    }
    case "special_day":
      return new SpecialDayEvent(
        raw.title,
        date,
        typeof raw.specialKind === "string" ? raw.specialKind : raw.title,
        raw.description,
        raw.id,
      )
    default: {
      // Exhaustiveness check: TS reclama em compile time se um novo kind
      // for adicionado sem ser tratado aqui.
      const _exhaustive: never = raw.kind
      throw new Error(`eventFromJSON: kind desconhecido ${String(_exhaustive)}`)
    }
  }
}

// Type guard helpers — úteis na UI quando precisamos do dado específico.
export function isStudyEvent(e: CalendarEvent): e is StudyEvent {
  return e.getCategory() === "study"
}
export function isExamEvent(e: CalendarEvent): e is ExamEvent {
  return e.getCategory() === "exam"
}
export function isAssignmentEvent(e: CalendarEvent): e is AssignmentEvent {
  return e.getCategory() === "assignment"
}
export function isSchoolDayEvent(e: CalendarEvent): e is SchoolDayEvent {
  return e.getCategory() === "school_day"
}
export function isSpecialDayEvent(e: CalendarEvent): e is SpecialDayEvent {
  return e.getCategory() === "special_day"
}
