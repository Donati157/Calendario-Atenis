/*
 * CalendarGrid — grade do calendario (6 semanas x 7 dias).
 *
 * Unit 8 — ARRAY 2D: DayCell[][]. Acesso via grid[row][col].
 * Unit 4 — Nested loops pra varrer / buscar.
 */
public class CalendarGrid {

    // Unit 8: ARRAY 2D. 6 linhas (semanas) x 7 colunas (dias da semana).
    private final DayCell[][] cells;
    private final int year;
    private final int month;

    public CalendarGrid(int year, int month) {
        this.year = year;
        this.month = month;
        this.cells = build(year, month);
    }

    public int getYear()         { return year; }
    public int getMonth()        { return month; }
    public int getRowCount()     { return cells.length; }
    public int getColCount()     { return (cells.length == 0) ? 0 : cells[0].length; }
    public DayCell getCell(int row, int col) { return cells[row][col]; }

    public DayCell[][] getCells() {
        // Defensive copy de array 2D — copia linha por linha.
        DayCell[][] out = new DayCell[cells.length][];
        for (int r = 0; r < cells.length; r++) {
            out[r] = new DayCell[cells[r].length];
            for (int c = 0; c < cells[r].length; c++) {
                out[r][c] = cells[r][c];
            }
        }
        return out;
    }

    // Unit 4 + 8: nested loop pra varrer a matriz inteira buscando
    // uma data especifica. Demonstra "row-major search".
    public int[] findCell(int y, int m, int d) {
        for (int r = 0; r < cells.length; r++) {
            for (int c = 0; c < cells[r].length; c++) {
                DayCell cell = cells[r][c];
                if (cell.getYear() == y && cell.getMonth() == m
                        && cell.getDay() == d) {
                    return new int[] { r, c };
                }
            }
        }
        return null; // nao encontrado
    }

    // Unit 5 + 8: utility privado pra montar a matriz.
    // 42 slots (6*7). Comeca no domingo da semana que contem o dia 1.
    private static DayCell[][] build(int year, int month) {
        // weekday do dia 1: 0=domingo .. 6=sabado.
        int startWeekday = zellersWeekday(year, month, 1);

        // Volta startWeekday dias a partir do dia 1.
        int cursorYear = year;
        int cursorMonth = month;
        int cursorDay = 1 - startWeekday;
        // Normaliza se ficou negativo (mes anterior).
        while (cursorDay <= 0) {
            cursorMonth--;
            if (cursorMonth < 1) { cursorMonth = 12; cursorYear--; }
            cursorDay = cursorDay + daysInMonth(cursorYear, cursorMonth);
        }

        DayCell[][] grid = new DayCell[6][7];
        for (int r = 0; r < 6; r++) {
            for (int c = 0; c < 7; c++) {
                boolean inMonth = (cursorYear == year && cursorMonth == month);
                grid[r][c] = new DayCell(cursorYear, cursorMonth, cursorDay, inMonth);
                // proximo dia
                cursorDay++;
                if (cursorDay > daysInMonth(cursorYear, cursorMonth)) {
                    cursorDay = 1;
                    cursorMonth++;
                    if (cursorMonth > 12) { cursorMonth = 1; cursorYear++; }
                }
            }
        }
        return grid;
    }

    // Zeller's congruence (simplificada): retorna 0=Dom..6=Sab.
    // Vale pro calendario gregoriano.
    public static int zellersWeekday(int y, int m, int d) {
        int yy = y;
        int mm = m;
        if (mm < 3) { mm = mm + 12; yy = yy - 1; }
        int K = yy % 100;
        int J = yy / 100;
        int h = (d + (13 * (mm + 1)) / 5 + K + K/4 + J/4 + 5*J) % 7;
        // h: 0=sabado, 1=domingo... Convertemos pra 0=dom..6=sab.
        int weekday = (h + 6) % 7;
        return weekday;
    }

    public static int daysInMonth(int year, int month) {
        if (month == 4 || month == 6 || month == 9 || month == 11) return 30;
        if (month == 2) {
            // Bissexto: divisivel por 4, exceto seculos nao-divisiveis
            // por 400.
            boolean leap = (year % 4 == 0 && year % 100 != 0)
                         || (year % 400 == 0);
            return leap ? 29 : 28;
        }
        return 31;
    }

    public static String monthName(int month) {
        String[] names = {
            "Janeiro", "Fevereiro", "Marco", "Abril",
            "Maio", "Junho", "Julho", "Agosto",
            "Setembro", "Outubro", "Novembro", "Dezembro"
        };
        if (month < 1 || month > 12) return "";
        return names[month - 1];
    }

    public static String[] weekdayHeaders() {
        return new String[] {
            "Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"
        };
    }
}
