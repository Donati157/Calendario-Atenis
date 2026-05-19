/*
 * Main — demonstracao runnable da camada OOP.
 *
 * Para rodar:
 *   cd java
 *   javac *.java
 *   java Main
 */
import java.util.ArrayList;

public class Main {

    public static void main(String[] args) {
        System.out.println("=== Calendario · AP Computer Science demo ===\n");

        // 1) Cria uma lista de eventos (Unit 7 — ArrayList API).
        EventList list = new EventList();
        list.add(new StudyEvent("Revisar quadraticas",
            2026, 5, 12, 14, 30, "Bhaskara", "Matematica", 60));
        list.add(new ExamEvent("Simulado ENEM",
            2026, 5, 15, 8, 0, "Prova completa", "ENEM"));
        list.add(new AssignmentEvent("Entregar redacao",
            2026, 5, 14, 23, 59, "GCD essay", "Portugues"));

        System.out.println("Lista inicial:");
        for (int i = 0; i < list.size(); i++) {
            System.out.println("  " + list.get(i));
        }

        // 2) Selection Sort por data (Unit 7).
        list.selectionSortByDate();
        System.out.println("\nApos Selection Sort (por data):");
        for (int i = 0; i < list.size(); i++) {
            System.out.println("  " + list.get(i));
        }

        // 3) Adiciona o dia letivo gerado pela rotacao (Unit 5 composicao).
        ArrayList<Period> dia6 = RotationEngine.periodsForDate(2026, 5, 11);
        SchoolDayEvent schoolDay = new SchoolDayEvent(
            "Dia 6", 2026, 5, 11, 7, 30,
            "Rotacao Concept SP", 6, dia6
        );
        list.add(schoolDay);

        System.out.println("\nSchoolDayEvent adicionado:");
        System.out.println("  " + schoolDay);
        System.out.println("  Cycle: " + schoolDay.getDayCycle());
        System.out.println("  Periodos academicos: "
            + schoolDay.countAcademicPeriods());
        ArrayList<Period> ps = schoolDay.getPeriods();
        for (int i = 0; i < ps.size(); i++) {
            Period p = ps.get(i);
            System.out.println("    " + p.getStartLabel() + "-"
                + p.getEndLabel() + "  " + p.getSubject());
        }

        // 4) Insertion Sort por titulo + Binary Search (Unit 7).
        list.insertionSortByTitle();
        System.out.println("\nApos Insertion Sort (por titulo):");
        for (int i = 0; i < list.size(); i++) {
            System.out.println("  " + i + ": " + list.get(i).getTitle());
        }
        int idx = list.binarySearchByTitle("Dia 6");
        System.out.println("\nBinary search 'Dia 6' -> indice " + idx);

        // 5) Recursao (Unit 10).
        int total = EventScheduler.countEventsRecursive(list, 0);
        int exams = EventScheduler.countByCategoryRecursive(list, "exam", 0);
        System.out.println("\nRecursao:");
        System.out.println("  Total de eventos (recursivo) = " + total);
        System.out.println("  Provas (recursivo)            = " + exams);

        // 6) Rotacao automatica para todos os dias uteis de maio/2026.
        System.out.println("\n--- Rotacao automatica (maio/2026) ---");
        for (int day = 1; day <= 31; day++) {
            int cycle = RotationEngine.getCycleDayForDate(2026, 5, day);
            int wd = CalendarGrid.zellersWeekday(2026, 5, day);
            String[] wdNames = CalendarGrid.weekdayHeaders();
            String label = (cycle == -1)
                ? (RotationEngine.isWeekend(2026, 5, day)
                    ? "(fim de semana)"
                    : "(evento especial)")
                : ("Dia " + cycle);
            System.out.println("  " + (day < 10 ? "0" : "") + day + "/05 "
                + wdNames[wd] + "  " + label);
        }

        // 7) Heatmap (Unit 8 — agregacao 2D).
        CalendarGrid grid = new CalendarGrid(2026, 5);
        int[][] heat = EventScheduler.heatmapMatrix(list, grid);
        System.out.println("\n--- Heatmap maio/2026 (Unit 8) ---");
        String[] wdHeaders = CalendarGrid.weekdayHeaders();
        StringBuilder header = new StringBuilder("  ");
        for (int c = 0; c < wdHeaders.length; c++) header.append(wdHeaders[c]).append(" ");
        System.out.println(header.toString());
        for (int r = 0; r < heat.length; r++) {
            StringBuilder row = new StringBuilder("  ");
            for (int c = 0; c < heat[r].length; c++) {
                int v = heat[r][c];
                row.append(v == -1 ? " . " : "  " + v + " ");
            }
            System.out.println(row.toString());
        }
        int max = EventScheduler.maxInMatrix(heat);
        System.out.println("  max = " + max);

        System.out.println("\n=== fim ===");
    }
}
