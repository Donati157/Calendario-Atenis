/*
 * EventList — wrapper estilo ArrayList<CalendarEvent>.
 *
 * Unit 7 — ArrayList API completa (add, get, set, remove, size).
 * Unit 7 — Selection Sort (por data) + Insertion Sort (por titulo).
 * Unit 7 — Binary Search por titulo (O(log n)).
 * Unit 4 — Linear search + filtros (filterByCategory, filterByDate).
 * Unit 4 — findOverlapping: deteccao de conflito de intervalos.
 */
import java.util.ArrayList;

public class EventList {

    // Por baixo dos panos, e um ArrayList. A classe so adiciona
    // metodos especificos do dominio.
    private ArrayList<CalendarEvent> items;

    public EventList() {
        this.items = new ArrayList<CalendarEvent>();
    }

    // ---------- API basica do ArrayList (Unit 7) ----------

    public int size() {
        return items.size();
    }

    public boolean isEmpty() {
        return items.size() == 0;
    }

    public CalendarEvent get(int index) {
        return items.get(index);
    }

    public boolean add(CalendarEvent ev) {
        return items.add(ev);
    }

    public CalendarEvent set(int index, CalendarEvent ev) {
        return items.set(index, ev);
    }

    public CalendarEvent remove(int index) {
        return items.remove(index);
    }

    // ---------- Linear search (Unit 4) ----------

    public boolean removeById(int id) {
        for (int i = 0; i < items.size(); i++) {
            if (items.get(i).getId() == id) {
                items.remove(i);
                return true;
            }
        }
        return false;
    }

    // ---------- Filtros (Unit 4: traverse + copia condicional) ----------

    public EventList filterByCategory(String category) {
        EventList out = new EventList();
        for (int i = 0; i < items.size(); i++) {
            CalendarEvent ev = items.get(i);
            if (ev.getCategory().equals(category)) {
                out.add(ev);
            }
        }
        return out;
    }

    public EventList filterByDate(int year, int month, int day) {
        EventList out = new EventList();
        for (int i = 0; i < items.size(); i++) {
            CalendarEvent ev = items.get(i);
            if (ev.isOnDate(year, month, day)) {
                out.add(ev);
            }
        }
        return out;
    }

    // Substring search no titulo (case-insensitive).
    public ArrayList<CalendarEvent> linearFilterByTitle(String query) {
        ArrayList<CalendarEvent> out = new ArrayList<CalendarEvent>();
        String q = query.trim().toLowerCase();
        if (q.length() == 0) return out;
        for (int i = 0; i < items.size(); i++) {
            CalendarEvent ev = items.get(i);
            if (ev.getTitle().toLowerCase().indexOf(q) >= 0) {
                out.add(ev);
            }
        }
        return out;
    }

    // ---------- Selection Sort por data (Unit 7) ----------
    //
    // Algoritmo classico do CED: a cada iteracao, acha o MENOR do
    // resto e troca com a posicao corrente.
    public void selectionSortByDate() {
        int n = items.size();
        for (int i = 0; i < n - 1; i++) {
            int minIdx = i;
            for (int j = i + 1; j < n; j++) {
                if (items.get(j).compareDate(items.get(minIdx)) < 0) {
                    minIdx = j;
                }
            }
            if (minIdx != i) {
                // swap
                CalendarEvent tmp = items.get(i);
                items.set(i, items.get(minIdx));
                items.set(minIdx, tmp);
            }
        }
    }

    // ---------- Insertion Sort por titulo (Unit 7) ----------
    //
    // Pre-requisito do binary search abaixo: BS exige lista ordenada.
    public void insertionSortByTitle() {
        int n = items.size();
        for (int i = 1; i < n; i++) {
            CalendarEvent key = items.get(i);
            int j = i - 1;
            while (j >= 0 && items.get(j).compareTitle(key) > 0) {
                items.set(j + 1, items.get(j));
                j--;
            }
            items.set(j + 1, key);
        }
    }

    // ---------- Binary Search por titulo (Unit 7) ----------
    //
    // Pre-condicao: lista ORDENADA por titulo (rodar insertionSortByTitle
    // antes). Retorna o indice do match exato, ou -1.
    // Complexidade: O(log n).
    public int binarySearchByTitle(String title) {
        String target = title.trim().toLowerCase();
        int lo = 0;
        int hi = items.size() - 1;
        while (lo <= hi) {
            int mid = (lo + hi) / 2;
            String midTitle = items.get(mid).getTitle().toLowerCase();
            int cmp = midTitle.compareTo(target);
            if (cmp == 0) return mid;
            if (cmp < 0) lo = mid + 1;
            else         hi = mid - 1;
        }
        return -1;
    }

    // ---------- Detector de conflito de horario (Unit 4) ----------
    //
    // Dois intervalos [aStart, aEnd) e [bStart, bEnd) se sobrepoem
    // se e somente se aStart < bEnd && bStart < aEnd.
    public ArrayList<CalendarEvent> findOverlapping(
            int year, int month, int day, int hour, int minute,
            int durationMinutes) {
        ArrayList<CalendarEvent> out = new ArrayList<CalendarEvent>();
        // Converte o intervalo de entrada em minutos absolutos
        int aStart = totalMinutes(year, month, day, hour, minute);
        int aEnd = aStart + durationMinutes;
        for (int i = 0; i < items.size(); i++) {
            CalendarEvent ev = items.get(i);
            int dur = ev.getDurationMinutes();
            if (dur <= 0) continue;  // assignments nunca conflitam
            int bStart = totalMinutes(
                ev.getYear(), ev.getMonth(), ev.getDay(),
                ev.getHour(), ev.getMinute()
            );
            int bEnd = bStart + dur;
            if (aStart < bEnd && bStart < aEnd) {
                out.add(ev);
            }
        }
        return out;
    }

    // Helper: converte data/hora em minutos absolutos (mesma logica
    // de CalendarEvent.toMinutes, mas estatica).
    private static int totalMinutes(int y, int m, int d, int h, int mi) {
        int days = (y * 12 + m) * 31 + d;
        return days * 24 * 60 + h * 60 + mi;
    }

    // Acesso ao array interno (read-only — cuidar de nao mutar).
    public ArrayList<CalendarEvent> toArrayList() {
        return new ArrayList<CalendarEvent>(items);
    }
}
