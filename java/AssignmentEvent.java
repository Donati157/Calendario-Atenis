/*
 * AssignmentEvent — uma tarefa/deadline.
 *
 * Unit 9: extends + super + @Override.
 * Diferenca: duracao 0 (e um ponto no tempo, nao um intervalo).
 */
public class AssignmentEvent extends CalendarEvent {

    private String subject;

    public AssignmentEvent(String title, int year, int month, int day,
                           int hour, int minute, String description,
                           String subject) {
        super(title, year, month, day, hour, minute, description);
        this.subject = subject;
    }

    public String getSubject() {
        return subject;
    }

    @Override
    public String getCategory() {
        return "assignment";
    }

    // Tarefa nao tem duracao — e so um prazo.
    @Override
    public int getDurationMinutes() {
        return 0;
    }
}
