/*
 * SchoolDayEvent — um dia letivo inteiro com varias aulas dentro.
 *
 * Unit 5 — COMPOSICAO: este objeto HAS-A array de Period.
 * Diferente de heranca (IS-A), composicao = "tem um".
 *
 * Unit 9: estende CalendarEvent e sobrescreve metodos.
 */
import java.util.ArrayList;

public class SchoolDayEvent extends CalendarEvent {

    private final int dayCycle;          // 1..6 (rotacao Concept SP)
    private final ArrayList<Period> periods;

    public SchoolDayEvent(String title, int year, int month, int day,
                          int hour, int minute, String description,
                          int dayCycle, ArrayList<Period> periods) {
        super(title, year, month, day, hour, minute, description);
        this.dayCycle = dayCycle;
        // Defensive copy: o objeto interno nao deve ser mutavel de fora.
        this.periods = new ArrayList<Period>(periods);
    }

    public int getDayCycle() {
        return dayCycle;
    }

    public ArrayList<Period> getPeriods() {
        // Defensive copy na saida tambem.
        return new ArrayList<Period>(periods);
    }

    // Unit 4 (Iteration): traverse + filtro condicional.
    public ArrayList<String> getAcademicSubjects() {
        ArrayList<String> out = new ArrayList<String>();
        for (int i = 0; i < periods.size(); i++) {
            Period p = periods.get(i);
            if (p.isAcademic()) {
                out.add(p.getSubject());
            }
        }
        return out;
    }

    // Unit 4: contagem com acumulador.
    public int countAcademicPeriods() {
        int count = 0;
        for (int i = 0; i < periods.size(); i++) {
            if (periods.get(i).isAcademic()) {
                count++;
            }
        }
        return count;
    }

    @Override
    public String getCategory() {
        return "school_day";
    }

    // Unit 9 + 4: do inicio do primeiro periodo ate o fim do ultimo.
    @Override
    public int getDurationMinutes() {
        if (periods.size() == 0) {
            return super.getDurationMinutes();
        }
        Period first = periods.get(0);
        Period last = periods.get(periods.size() - 1);
        return last.getEndMinutes() - first.getStartMinutes();
    }
}
