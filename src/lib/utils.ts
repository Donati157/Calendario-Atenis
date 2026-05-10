// cn — concatena classes ignorando falsy. Versão minimal sem
// clsx/tailwind-merge para o standalone não puxar dependências extras.
export function cn(...args: Array<string | undefined | null | false>): string {
  return args.filter(Boolean).join(" ")
}
