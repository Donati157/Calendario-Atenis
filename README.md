# Calendário · Persona José

Calendário standalone (Vite + React 19 + TypeScript + Tailwind) que demonstra
conceitos de **AP Computer Science A** na engenharia por trás:

- **Unit 5 / 9**: classes abstratas, herança, polimorfismo, composição
- **Unit 7**: ArrayList API, Selection Sort, Insertion Sort
- **Unit 8**: Arrays 2D (matriz semanas × dias)
- **Unit 10**: recursão

Inclui a agenda da persona José (15 dias letivos de maio/2026, rotação
Concept SP) carregável com 1 clique.

## Rodar local

```bash
npm install
npm run dev          # abre em http://localhost:5174
```

## Scripts

| Script | O que faz |
|---|---|
| `npm run dev` | Vite dev server na porta 5174 |
| `npm run build` | Build de produção |
| `npm run preview` | Preview do build |
| `npm run typecheck` | `tsc -b --pretty` |

## Estrutura

```
src/
├── App.tsx
├── main.tsx
├── index.css
├── lib/
│   ├── utils.ts
│   └── calendar/         # camada OOP didática (AP CS)
│       ├── CalendarEvent.ts
│       ├── EventTypes.ts
│       ├── Period.ts
│       ├── EventList.ts
│       ├── CalendarGrid.ts
│       ├── EventScheduler.ts
│       ├── jose-schedule.ts
│       └── index.ts
└── components/
    ├── ui/               # Button, Card, Input, Label, Textarea
    └── calendar/
        ├── calendar-client.tsx
        ├── event-form.tsx
        └── concept-panel.tsx
```

Dados persistem em `localStorage` (chave `calendario.jose.events`).
