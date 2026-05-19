/*
 * StudyEvent — uma sessao de estudo.
 *
 * Unit 9 (Inheritance):
 *   - "extends CalendarEvent" -> StudyEvent IS-A CalendarEvent.
 *   - super(...) chama o construtor da superclasse.
 *   - @Override em getCategory() e getDurationMinutes() -> polimorfismo.
 */
public class StudyEvent extends CalendarEvent {

    private String subject;          // materia estudada
    private int durationMinutes;     // quanto tempo a sessao dura

    public StudyEvent(String title, int year, int month, int day,
                      int hour, int minute, String description,
                      String subject, int durationMinutes) {
        // Unit 9: super(...) inicializa a parte herdada do objeto.
        super(title, year, month, day, hour, minute, description);
        this.subject = subject;
        this.durationMinutes = durationMinutes;
    }

    public String getSubject() {
        return subject;
    }

    // Unit 9: override do metodo abstract da superclasse.
    @Override
    public String getCategory() {
        return "study";
    }

    // Unit 9: override do metodo padrao — usa a duracao real digitada.
    @Override
    public int getDurationMinutes() {
        return durationMinutes;
    }
}
