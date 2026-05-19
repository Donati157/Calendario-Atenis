/*
 * CalendarEvent — classe base de qualquer item do calendario.
 *
 * Versao Java (AP Computer Science A) da camada de objetos do site.
 * Linguagem simplificada: a data e guardada como inteiros (ano, mes,
 * dia, hora, minuto) em vez de uma biblioteca de datas.
 *
 * Conceitos do CED demonstrados aqui:
 *   Unit 2 — Using Objects: construtor, this, criacao de instancias.
 *   Unit 5 — Writing Classes: classe abstract, encapsulamento
 *            (campos private + getters/setters), variavel static
 *            (nextId), metodo static (gerar id).
 *   Unit 9 — Inheritance: getCategory() e abstract, as subclasses
 *            obrigatoriamente implementam -> polimorfismo.
 */
public abstract class CalendarEvent {

    // Unit 5: variavel static — compartilhada por TODAS as instancias.
    private static int nextId = 1;

    // Unit 5: encapsulamento — campos private, acesso so por metodos.
    private final int id;
    private String title;
    private int year;
    private int month;   // 1..12
    private int day;     // 1..31
    private int hour;    // 0..23
    private int minute;  // 0..59
    private String description;

    public CalendarEvent(String title, int year, int month, int day,
                         int hour, int minute, String description) {
        this.id = nextId;
        nextId = nextId + 1;          // proximo evento ganha id diferente
        this.title = title;
        this.year = year;
        this.month = month;
        this.day = day;
        this.hour = hour;
        this.minute = minute;
        this.description = description;
    }

    // ---------- getters ----------
    public int getId()             { return id; }
    public String getTitle()       { return title; }
    public int getYear()           { return year; }
    public int getMonth()          { return month; }
    public int getDay()            { return day; }
    public int getHour()           { return hour; }
    public int getMinute()         { return minute; }
    public String getDescription() { return description; }

    // ---------- setters ----------
    public void setTitle(String t)       { this.title = t; }
    public void setDescription(String d) { this.description = d; }

    // ---------- metodos abstract (Unit 9) ----------
    // Cada subclasse OBRIGATORIAMENTE implementa. Quando o programa
    // chama evento.getCategory() em uma variavel do tipo CalendarEvent,
    // o metodo executado e o da subclasse real -> polimorfismo.
    public abstract String getCategory();

    // ---------- metodo com implementacao padrao (Unit 9) ----------
    // As subclasses PODEM sobrescrever (override). Em provas, escolas
    // duram mais; tarefas duram 0. Usado pelo detector de conflito.
    public int getDurationMinutes() {
        return 30;
    }

    // ---------- comparacoes (Unit 7 — base do sorting) ----------

    // Converte a data/hora em um unico numero de minutos para comparar
    // facilmente. Retorna negativo, zero ou positivo.
    public int compareDate(CalendarEvent other) {
        int mine  = this.toMinutes();
        int yours = other.toMinutes();
        if (mine < yours) return -1;
        if (mine > yours) return 1;
        return 0;
    }

    // Compara pelo titulo, ignorando maiusculas/minusculas.
    public int compareTitle(CalendarEvent other) {
        String a = this.title.toLowerCase();
        String b = other.title.toLowerCase();
        return a.compareTo(b);
    }

    // Verdadeiro se o evento cai num dia especifico.
    public boolean isOnDate(int y, int m, int d) {
        return this.year == y && this.month == m && this.day == d;
    }

    // Unit 1/2: aritmetica inteira. Transforma a data num total de
    // minutos para que dois eventos possam ser comparados com < e >.
    public int toMinutes() {
        // Aproximacao simples: cada mes tem 31 dias. Serve so para
        // ordenar eventos dentro de um mesmo ano/escala pequena.
        int days = (year * 12 + month) * 31 + day;
        return days * 24 * 60 + hour * 60 + minute;
    }

    // Unit 9: equivalente a toString() — texto legivel do evento.
    @Override
    public String toString() {
        return "[" + getCategory() + "] " + title + " — "
             + day + "/" + month + "/" + year + " "
             + pad(hour) + ":" + pad(minute);
    }

    // Helper privado: deixa numeros com 2 digitos (ex: 9 -> "09").
    private String pad(int n) {
        if (n < 10) return "0" + n;
        return "" + n;
    }
}
