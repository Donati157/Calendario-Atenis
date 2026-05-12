import { useEffect } from "react"

type Handler = (e: KeyboardEvent) => void

interface ShortcutMap {
  prevMonth?: Handler
  nextMonth?: Handler
  today?: Handler
  newEvent?: Handler
  search?: Handler
  escape?: Handler
}

// Atalhos:
//   ←  prevMonth   →  nextMonth   T  today
//   N  newEvent    ⌘K  search     Esc escape
// Ignora teclas comuns quando o foco está em input/textarea/contenteditable.
// ⌘K e Esc passam SEMPRE — pra abrir/fechar busca e modais.
export function useKeyboardShortcuts(map: ShortcutMap, enabled = true) {
  useEffect(() => {
    if (!enabled) return
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const tag = target?.tagName?.toLowerCase()
      const isTyping =
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        target?.isContentEditable === true

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        map.search?.(e)
        return
      }

      if (e.key === "Escape") {
        map.escape?.(e)
        return
      }

      if (isTyping) return

      switch (e.key) {
        case "ArrowLeft":
          map.prevMonth?.(e)
          break
        case "ArrowRight":
          map.nextMonth?.(e)
          break
        case "t":
        case "T":
          map.today?.(e)
          break
        case "n":
        case "N":
          map.newEvent?.(e)
          break
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [map, enabled])
}
