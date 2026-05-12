/**
 * Wrapper estilo ArrayList<CalendarEvent>.
 *
 * Conceitos AP CS A:
 *  - Unit 7 (ArrayList): add, remove, set, size, get — todos os métodos
 *    aparecem no CED e na prova. Aqui implementamos a interface usando
 *    um array nativo por baixo.
 *  - Unit 4 (Iteration): traverse for-each para filtrar (filterByDate)
 *    e para acumular (countByCategory).
 *  - Unit 7 (Sorting): selection sort O(n²) escrita "à mão" para casar
 *    com o que cai no exame, embora pudéssemos chamar Array#sort.
 *
 * Por que não usar Array nativo direto? Porque a ideia é mostrar a API
 * que o aluno vê no exame, e todo o resto do código consome essa API.
 */

import { CalendarEvent, type EventCategory } from "./CalendarEvent"

export class EventList {
  // Unit 7: a ArrayList por baixo dos panos é um array dinâmico.
  private items: CalendarEvent[]

  public constructor(initial: CalendarEvent[] = []) {
    this.items = [...initial] // defensive copy
  }

  // ───────── métodos da API ArrayList do AP CED ─────────

  public size(): number {
    return this.items.length
  }

  public isEmpty(): boolean {
    return this.items.length === 0
  }

  public get(index: number): CalendarEvent {
    if (index < 0 || index >= this.items.length) {
      throw new RangeError(`EventList.get: índice ${index} fora dos limites`)
    }
    return this.items[index]
  }

  public add(event: CalendarEvent): boolean {
    this.items.push(event)
    return true
  }

  public set(index: number, event: CalendarEvent): CalendarEvent {
    if (index < 0 || index >= this.items.length) {
      throw new RangeError(`EventList.set: índice ${index} fora dos limites`)
    }
    const old = this.items[index]
    this.items[index] = event
    return old
  }

  public remove(index: number): CalendarEvent {
    if (index < 0 || index >= this.items.length) {
      throw new RangeError(
        `EventList.remove: índice ${index} fora dos limites`,
      )
    }
    return this.items.splice(index, 1)[0]
  }

  // Unit 4 + 7: linear search por id.
  public removeById(id: string): boolean {
    for (let i = 0; i < this.items.length; i++) {
      if (this.items[i].getId() === id) {
        this.items.splice(i, 1)
        return true
      }
    }
    return false
  }

  public indexOfId(id: string): number {
    for (let i = 0; i < this.items.length; i++) {
      if (this.items[i].getId() === id) return i
    }
    return -1
  }

  // ───────── filtros & utilitários (consumidos pela UI) ─────────

  // Unit 4: traverse + cópia condicional.
  public filterByDate(year: number, month: number, day: number): EventList {
    const out = new EventList()
    for (const ev of this.items) {
      if (ev.isOnDate(year, month, day)) out.add(ev)
    }
    return out
  }

  // Unit 4: traverse + acumulador. Devolve dicionário por categoria.
  public countByCategory(): Record<EventCategory, number> {
    const counts: Record<EventCategory, number> = {
      study: 0,
      exam: 0,
      assignment: 0,
      school_day: 0,
      special_day: 0,
    }
    for (const ev of this.items) {
      counts[ev.getCategory()]++
    }
    return counts
  }

  // Devolve o array nativo (cópia) — usado na UI quando React precisa.
  public toArray(): CalendarEvent[] {
    return [...this.items]
  }

  // Unit 7: Selection Sort por data (in place).
  // Algoritmo do CED: a cada passo, encontra o menor do "resto" e troca
  // com a posição corrente.
  public selectionSortByDate(): void {
    const n = this.items.length
    for (let i = 0; i < n - 1; i++) {
      let minIdx = i
      for (let j = i + 1; j < n; j++) {
        if (this.items[j].compareDate(this.items[minIdx]) < 0) {
          minIdx = j
        }
      }
      if (minIdx !== i) {
        // swap
        const tmp = this.items[i]
        this.items[i] = this.items[minIdx]
        this.items[minIdx] = tmp
      }
    }
  }

  // Versão imutável para quando a UI quer uma lista ordenada sem
  // mexer na original.
  public sortedByDate(): CalendarEvent[] {
    const copy = new EventList(this.items)
    copy.selectionSortByDate()
    return copy.toArray()
  }

  // ───────── filtros e busca ─────────

  // Unit 4: filtra por categoria.
  public filterByCategory(category: EventCategory): EventList {
    const out = new EventList()
    for (const ev of this.items) {
      if (ev.getCategory() === category) out.add(ev)
    }
    return out
  }

  // Unit 4: linear search por título (case-insensitive, substring).
  public linearFilterByTitle(query: string): CalendarEvent[] {
    const q = query.trim().toLowerCase()
    if (q.length === 0) return []
    const out: CalendarEvent[] = []
    for (const ev of this.items) {
      if (ev.getTitle().toLowerCase().includes(q)) out.push(ev)
    }
    return out
  }

  // ───────── ordenação por título (Unit 7) ─────────

  // Unit 7: Insertion Sort por título (in place). Pré-requisito do BS.
  public insertionSortByTitle(): void {
    const n = this.items.length
    for (let i = 1; i < n; i++) {
      const key = this.items[i]
      let j = i - 1
      while (j >= 0 && this.items[j].compareTitle(key) > 0) {
        this.items[j + 1] = this.items[j]
        j--
      }
      this.items[j + 1] = key
    }
  }

  public sortedByTitle(): CalendarEvent[] {
    const copy = new EventList(this.items)
    copy.insertionSortByTitle()
    return copy.toArray()
  }

  // Unit 7: Binary Search por título (exact match, case-insensitive).
  // Pré-condição: lista ORDENADA por título. Retorna índice ou -1.
  public binarySearchByTitle(title: string): number {
    const target = title.trim().toLowerCase()
    let lo = 0
    let hi = this.items.length - 1
    while (lo <= hi) {
      const mid = Math.floor((lo + hi) / 2)
      const cmp = this.items[mid]
        .getTitle()
        .toLowerCase()
        .localeCompare(target, "pt-BR")
      if (cmp === 0) return mid
      if (cmp < 0) lo = mid + 1
      else hi = mid - 1
    }
    return -1
  }

  // ───────── detector de conflito de horário (Unit 4) ─────────

  // Dois intervalos [aStart, aEnd) e [bStart, bEnd) se sobrepõem se
  // e somente se aStart < bEnd && bStart < aEnd.
  public findOverlapping(
    start: Date,
    durationMinutes: number,
    excludeId?: string,
  ): CalendarEvent[] {
    const out: CalendarEvent[] = []
    const aStart = start.getTime()
    const aEnd = aStart + Math.max(0, durationMinutes) * 60_000
    for (const ev of this.items) {
      if (excludeId && ev.getId() === excludeId) continue
      if (ev.getDurationMinutes() <= 0) continue
      const bStart = ev.getDate().getTime()
      const bEnd = bStart + ev.getDurationMinutes() * 60_000
      if (aStart < bEnd && bStart < aEnd) out.push(ev)
    }
    return out
  }
}
