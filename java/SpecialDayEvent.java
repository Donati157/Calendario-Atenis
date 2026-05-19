/*
 * SpecialDayEvent — dia escolar especial (Inter House, FOL, etc.).
 *
 * Pausa o ciclo da rotacao: no proximo dia letivo, o ciclo CONTINUA
 * do mesmo ponto (nao avanca por causa do evento especial).
 */
public class SpecialDayEvent extends CalendarEvent {

    private String kind;  // ex: "Inter House", "FOL"

    public SpecialDayEvent(String title, int year, int month, int day,
                           int hour, int minute, String description,
                           String kind) {
        super(title, year, month, day, hour, minute, description);
        this.kind = kind;
    }

    public String getKind() {
        return kind;
    }

    @Override
    public String getCategory() {
        return "special_day";
    }

    // Dia escolar inteiro: 8h de duracao.
    @Override
    public int getDurationMinutes() {
        return 8 * 60;
    }
}
