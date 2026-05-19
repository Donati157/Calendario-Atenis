# Calendario · versao Java (AP Computer Science A)

Espelho da camada OOP do site, escrito em **Java puro** com a linguagem
do CED de AP CS A. Sem bibliotecas externas, sem UI — so as classes
que demonstram os conceitos do curso.

## Como rodar

Precisa ter JDK 8+ instalado.

```bash
cd java
javac *.java
java Main
```

`Main.java` cria uma lista de eventos, ordena, busca, gera a rotacao
automatica de maio/2026 e imprime tudo no console.

## Arquivos e conceitos do CED

| Arquivo | Units demonstradas |
|---|---|
| `CalendarEvent.java` | Unit 2 (Using Objects), Unit 5 (abstract class, encapsulamento, static), Unit 9 (Inheritance) |
| `StudyEvent.java` | Unit 9 — extends, super(), @Override |
| `ExamEvent.java` | Unit 9 — override de getDurationMinutes (default 30 -> 120) |
| `AssignmentEvent.java` | Unit 9 — override de getDurationMinutes (default 30 -> 0) |
| `Period.java` | Unit 5 (value class com campos `final`), Unit 1/2 (aritmetica inteira) |
| `SchoolDayEvent.java` | **Unit 5 — COMPOSICAO** (HAS-A ArrayList<Period>), Unit 4 (traverse) |
| `SpecialDayEvent.java` | Heranca + override (pausa o ciclo da rotacao) |
| `EventList.java` | Unit 7 — ArrayList API + **Selection Sort** + **Insertion Sort** + **Binary Search**; Unit 4 — filtros e detector de conflito de intervalos |
| `DayCell.java` | Unit 2 — value class simples |
| `CalendarGrid.java` | **Unit 8 — ARRAY 2D** (matriz 6x7), Unit 4 — nested loops |
| `EventScheduler.java` | **Unit 10 — RECURSAO** (countEventsRecursive, countByCategoryRecursive), Unit 5 (utility class static), Unit 8 (agregacao 2D do heatmap) |
| `RotationEngine.java` | Algoritmo de **rotacao de 6 dias** que pula fins de semana e pausa em eventos especiais |
| `Main.java` | Demo runnable que exercita TODAS as classes |

## Diferencas vs versao TypeScript

A versao do site (TypeScript) tem:
- Serializacao JSON (`toJSON`/`fromJSON`) — nao esta na versao Java
  pra manter o foco no AP CS A puro.
- Cores/icones (CSS classes / emojis) — versao Java tem so o nome
  da categoria.
- Data como `Date` do JS — versao Java guarda como `int year, month,
  day, hour, minute`, mais proximo do que se faz em AP CS A.

Tudo o resto e equivalente.
