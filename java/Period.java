/*
 * Period — um bloco de aula dentro de um dia letivo.
 *
 * Unit 5: "value class" pequena, todos os campos final (imutavel).
 * Unit 1/2: aritmetica inteira pra formatar HH:mm.
 */
public class Period {

    // final = readonly. Em Java significa "so atribui no construtor".
    private final int index;          // 1, 2, 3, ...
    private final String subject;
    private final int startMinutes;   // minutos desde 00:00
    private final int endMinutes;

    public Period(int index, String subject, int startMinutes, int endMinutes) {
        this.index = index;
        this.subject = subject;
        this.startMinutes = startMinutes;
        this.endMinutes = endMinutes;
    }

    public int getIndex()           { return index; }
    public String getSubject()      { return subject; }
    public int getStartMinutes()    { return startMinutes; }
    public int getEndMinutes()      { return endMinutes; }
    public int getDurationMinutes() { return endMinutes - startMinutes; }

    // Unit 1/2: aritmetica inteira — dividir minutos por 60 da a hora,
    // o resto e o minuto.
    public String getStartLabel() { return formatTime(startMinutes); }
    public String getEndLabel()   { return formatTime(endMinutes); }

    // Diferencia "intervalos institucionais" (advisory, recreio, almoco)
    // de aulas academicas reais.
    public boolean isAcademic() {
        String s = subject.toLowerCase();
        if (s.equals("advisory"))  return false;
        if (s.equals("break"))     return false;
        if (s.equals("almoço"))    return false;
        if (s.equals("almoco"))    return false;
        if (s.equals("intervalo")) return false;
        if (s.equals("recreio"))   return false;
        return true;
    }

    // Unit 5: metodo static — utilitario que nao precisa de instancia.
    private static String formatTime(int totalMin) {
        int h = totalMin / 60;
        int m = totalMin % 60;
        String hStr = (h < 10) ? "0" + h : "" + h;
        String mStr = (m < 10) ? "0" + m : "" + m;
        return hStr + ":" + mStr;
    }
}
