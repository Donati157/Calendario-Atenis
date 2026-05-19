/*
 * RotationEngine — calcula o "Dia" da rotacao (1..6) para qualquer data.
 *
 * Regras (Concept SP):
 *   1) Ciclo de 6 dias: Dia 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> volta pro 1.
 *   2) Sabados e domingos NAO contam.
 *   3) Eventos especiais (Inter House, FOL, etc.) PAUSAM o ciclo.
 *   4) Apos pausa, o proximo dia letivo continua do MESMO ponto.
 *
 * Algoritmo: a partir de uma data ancora conhecida (ex: 11/05/2026 = Dia 6),
 * caminha dia por dia ate a data alvo, avancando o ciclo a cada dia
 * letivo (nao-fim-de-semana, nao-especial).
 *
 * Conceitos do CED demonstrados:
 *   Unit 1/2 — Aritmetica inteira, modulo.
 *   Unit 4   — Iteration (while), enhanced-for, traversal.
 *   Unit 5   — Static utility class.
 */
import java.util.ArrayList;
import java.util.HashSet;

public class RotationEngine {

    // ---------- Ancora ----------
    // Ponto de referencia conhecido: 11/05/2026 (segunda) e Dia 6.
    public static final int ANCHOR_YEAR  = 2026;
    public static final int ANCHOR_MONTH = 5;
    public static final int ANCHOR_DAY   = 11;
    public static final int ANCHOR_CYCLE = 6;

    // ---------- Eventos especiais (pausam o ciclo) ----------
    // Datas armazenadas como "YYYY-M-D" pra lookup O(1) em HashSet.
    private static final HashSet<String> SPECIAL_DATES = makeSpecialSet();

    private static HashSet<String> makeSpecialSet() {
        HashSet<String> set = new HashSet<String>();
        set.add(key(2026, 5, 8));   // Inter House (sexta)
        set.add(key(2026, 5, 30));  // FOL (sabado — pega so se rolasse)
        return set;
    }

    private static String key(int y, int m, int d) {
        return y + "-" + m + "-" + d;
    }

    // ---------- API publica ----------

    // Retorna o numero do Dia (1..6) para a data, ou -1 se nao
    // for um dia letivo (fim de semana ou evento especial).
    public static int getCycleDayForDate(int year, int month, int day) {
        if (isWeekend(year, month, day)) return -1;
        if (isSpecial(year, month, day)) return -1;

        // Comeca na ancora e caminha dia a dia.
        int cursorYear = ANCHOR_YEAR;
        int cursorMonth = ANCHOR_MONTH;
        int cursorDay = ANCHOR_DAY;
        int cycle = ANCHOR_CYCLE;

        // Mesmo dia da ancora?
        if (cursorYear == year && cursorMonth == month && cursorDay == day) {
            return cycle;
        }

        int direction = compareDates(year, month, day,
                                     cursorYear, cursorMonth, cursorDay);

        if (direction > 0) {
            // Caminha pra frente
            while (true) {
                int[] next = addDays(cursorYear, cursorMonth, cursorDay, 1);
                cursorYear = next[0]; cursorMonth = next[1]; cursorDay = next[2];
                boolean targetReached = (cursorYear == year
                        && cursorMonth == month && cursorDay == day);
                if (!isWeekend(cursorYear, cursorMonth, cursorDay)
                        && !isSpecial(cursorYear, cursorMonth, cursorDay)) {
                    cycle = nextCycle(cycle);
                }
                if (targetReached) {
                    if (isWeekend(cursorYear, cursorMonth, cursorDay)
                            || isSpecial(cursorYear, cursorMonth, cursorDay)) {
                        return -1;
                    }
                    return cycle;
                }
            }
        } else {
            // Caminha pra tras
            while (true) {
                int[] prev = addDays(cursorYear, cursorMonth, cursorDay, -1);
                boolean wasSchoolDay = !isWeekend(cursorYear, cursorMonth, cursorDay)
                        && !isSpecial(cursorYear, cursorMonth, cursorDay);
                cursorYear = prev[0]; cursorMonth = prev[1]; cursorDay = prev[2];
                boolean targetReached = (cursorYear == year
                        && cursorMonth == month && cursorDay == day);
                if (wasSchoolDay) {
                    cycle = prevCycle(cycle);
                }
                if (targetReached) {
                    if (isWeekend(cursorYear, cursorMonth, cursorDay)
                            || isSpecial(cursorYear, cursorMonth, cursorDay)) {
                        return -1;
                    }
                    return cycle;
                }
            }
        }
    }

    public static boolean isWeekend(int y, int m, int d) {
        int wd = CalendarGrid.zellersWeekday(y, m, d);
        return wd == 0 || wd == 6;  // 0=Dom, 6=Sab
    }

    public static boolean isSpecial(int y, int m, int d) {
        return SPECIAL_DATES.contains(key(y, m, d));
    }

    // ---------- Templates de cada Dia do ciclo (Unit 4) ----------
    //
    // Cada Dia tem ate 4 blocos academicos. O "slot 4" (entre Break
    // e P2) e definido pelo dia-da-semana, NAO pelo numero do Dia.
    // Excecao: Dia 3 nao tem slot 4 (so 3 blocos academicos).

    public static String[] cycleTemplate(int dayCycle) {
        // Retorna [P1, P2, P3, P4] ou [P1, P2, P3] (Dia 3).
        if (dayCycle == 1) return new String[] {
            "Ingles", "Biologia", "AP Computer Science"
        };
        if (dayCycle == 2) return new String[] {
            "Matematica", "Portugues", "AP Seminar"
        };
        if (dayCycle == 3) return new String[] {  // 3 blocos so
            "AP Computer Science", "Ingles", "Quimica"
        };
        if (dayCycle == 4) return new String[] {
            "AP Seminar", "Matematica", "Portugues"
        };
        if (dayCycle == 5) return new String[] {
            "Fisica", "AP Computer Science", "Ingles"
        };
        if (dayCycle == 6) return new String[] {
            "Portugues", "AP Seminar", "Matematica"
        };
        return new String[0];
    }

    // Slot variavel por dia-da-semana (so existe quando Dia != 3).
    public static String dayOfWeekSlot(int weekday) {
        // 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sab
        if (weekday == 1) return "Projeto";
        if (weekday == 2) return "Extra de Ciencias";
        if (weekday == 3) return "Mandarim";
        if (weekday == 4) return "X Block de quinta";
        if (weekday == 5) return "Educacao Fisica";
        return "";
    }

    // Constroi a lista de periodos completa pra uma data.
    public static ArrayList<Period> periodsForDate(int y, int m, int d) {
        int cycle = getCycleDayForDate(y, m, d);
        if (cycle < 1) return new ArrayList<Period>();  // nao e dia letivo

        String[] academic = cycleTemplate(cycle);
        int weekday = CalendarGrid.zellersWeekday(y, m, d);
        String dowSlot = dayOfWeekSlot(weekday);

        ArrayList<Period> out = new ArrayList<Period>();
        if (cycle == 3) {
            // 6 blocos: P1, Advisory, Break, P2, Almoco, P3
            out.add(new Period(1, academic[0],  7*60+30, 8*60+25));
            out.add(new Period(2, "Advisory",   8*60+25, 8*60+40));
            out.add(new Period(3, "Break",      8*60+40, 9*60+0 ));
            out.add(new Period(4, academic[1], 9*60+0,  9*60+55));
            out.add(new Period(5, "Almoco",    9*60+55, 10*60+35));
            out.add(new Period(6, academic[2], 10*60+35, 11*60+30));
        } else {
            // 7 blocos: P1, Advisory, Break, [DOW], P2, Almoco, P3
            out.add(new Period(1, academic[0],   7*60+30,  8*60+25));
            out.add(new Period(2, "Advisory",    8*60+25,  8*60+40));
            out.add(new Period(3, "Break",       8*60+40,  9*60+0 ));
            out.add(new Period(4, dowSlot,       9*60+0,   9*60+55));
            out.add(new Period(5, academic[1],   9*60+55, 10*60+50));
            out.add(new Period(6, "Almoco",     10*60+50, 11*60+35));
            out.add(new Period(7, academic[2],  11*60+35, 12*60+30));
        }
        return out;
    }

    // ---------- helpers internos ----------

    private static int nextCycle(int c) {
        return (c % 6) + 1;  // 1->2..5->6, 6->1
    }
    private static int prevCycle(int c) {
        return (c == 1) ? 6 : (c - 1);
    }

    // Negativo: a < b. Zero: igual. Positivo: a > b.
    private static int compareDates(int ay, int am, int ad,
                                     int by, int bm, int bd) {
        if (ay != by) return ay - by;
        if (am != bm) return am - bm;
        return ad - bd;
    }

    // Soma `delta` dias e devolve [y, m, d] normalizado.
    private static int[] addDays(int y, int m, int d, int delta) {
        d = d + delta;
        while (d < 1) {
            m--;
            if (m < 1) { m = 12; y--; }
            d = d + CalendarGrid.daysInMonth(y, m);
        }
        while (d > CalendarGrid.daysInMonth(y, m)) {
            d = d - CalendarGrid.daysInMonth(y, m);
            m++;
            if (m > 12) { m = 1; y++; }
        }
        return new int[] { y, m, d };
    }
}
