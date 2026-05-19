/*
 * EventScheduler — utility class com algoritmos sobre EventList.
 *
 * Unit 5 — todos os metodos sao static (utility class no estilo Math).
 * Unit 10 — RECURSAO: countEventsRecursive, countByCategoryRecursive.
 * Unit 8 — agregacao 2D (heatmap).
 */
import java.util.ArrayList;

public class EventScheduler {

    // ---------- Unit 10: RECURSAO ----------
    //
    // Conta quantos eventos existem na lista a partir de `start`.
    // Caso base: indice fora dos limites -> 0.
    // Caso recursivo: 1 + chamada para o proximo indice.
    public static int countEventsRecursive(EventList list, int start) {
        if (start >= list.size()) {
            return 0;  // caso base
        }
        // caso recursivo
        return 1 + countEventsRecursive(list, start + 1);
    }

    // Recursao com filtro: conta eventos de uma categoria especifica.
    public static int countByCategoryRecursive(EventList list,
                                                String category,
                                                int start) {
        if (start >= list.size()) {
            return 0;
        }
        int head = list.get(start).getCategory().equals(category) ? 1 : 0;
        return head + countByCategoryRecursive(list, category, start + 1);
    }

    // ---------- Unit 4: traverse linear ----------
    //
    // Pre-condicao: lista ordenada por data (selectionSortByDate).
    // Devolve o primeiro evento >= agora, ou null.
    public static CalendarEvent nextUpcoming(EventList sortedList,
                                              int yearNow, int monthNow,
                                              int dayNow, int hourNow,
                                              int minuteNow) {
        int target = (yearNow * 12 + monthNow) * 31 * 24 * 60
                   + dayNow * 24 * 60 + hourNow * 60 + minuteNow;
        for (int i = 0; i < sortedList.size(); i++) {
            CalendarEvent ev = sortedList.get(i);
            int t = ev.toMinutes();
            if (t >= target) return ev;
        }
        return null;
    }

    // ---------- Unit 8 — heatmap (agregacao 2D) ----------
    //
    // Recebe uma EventList e uma CalendarGrid. Devolve uma matriz
    // 6x7 com a contagem de eventos por celula. Celulas fora do mes
    // ganham -1 pra que a UI possa ignorar.
    public static int[][] heatmapMatrix(EventList list, CalendarGrid grid) {
        int rows = grid.getRowCount();
        int cols = grid.getColCount();
        int[][] matrix = new int[rows][cols];
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                DayCell cell = grid.getCell(r, c);
                if (!cell.isInMonth()) {
                    matrix[r][c] = -1;
                    continue;
                }
                EventList dayList = list.filterByDate(
                    cell.getYear(), cell.getMonth(), cell.getDay()
                );
                matrix[r][c] = dayList.size();
            }
        }
        return matrix;
    }

    // Unit 4 + 8: varre a matriz inteira encontrando o maior valor
    // (ignora -1 que e spillover do mes vizinho).
    public static int maxInMatrix(int[][] matrix) {
        int max = 0;
        for (int r = 0; r < matrix.length; r++) {
            for (int c = 0; c < matrix[r].length; c++) {
                if (matrix[r][c] > max) {
                    max = matrix[r][c];
                }
            }
        }
        return max;
    }

    // ---------- Helper: junta varios eventos em um ArrayList -----
    //
    // Agrupa eventos por dia. Equivalente a Map<String,EventList> em TS.
    // Aqui usamos ArrayList simples por chave construida na hora.
    public static ArrayList<CalendarEvent> eventsForDay(
            EventList list, int year, int month, int day) {
        ArrayList<CalendarEvent> out = new ArrayList<CalendarEvent>();
        for (int i = 0; i < list.size(); i++) {
            CalendarEvent ev = list.get(i);
            if (ev.isOnDate(year, month, day)) {
                out.add(ev);
            }
        }
        return out;
    }
}
