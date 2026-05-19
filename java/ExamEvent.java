/*
 * ExamEvent — uma prova/exame.
 *
 * Unit 9: extends + super + @Override.
 */
public class ExamEvent extends CalendarEvent {

    private String exam;  // ENEM, Fuvest, AP Calculus, etc.

    public ExamEvent(String title, int year, int month, int day,
                     int hour, int minute, String description, String exam) {
        super(title, year, month, day, hour, minute, description);
        this.exam = exam;
    }

    public String getExam() {
        return exam;
    }

    @Override
    public String getCategory() {
        return "exam";
    }

    // Unit 9: override do default — prova padrao dura 2h.
    @Override
    public int getDurationMinutes() {
        return 120;
    }
}
