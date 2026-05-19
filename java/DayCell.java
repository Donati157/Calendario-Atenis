/*
 * DayCell — uma celula da grade do calendario.
 * Usada como tipo dos elementos da matriz 2D em CalendarGrid.
 */
public class DayCell {

    private final int year;
    private final int month;
    private final int day;
    private final boolean inMonth;  // false = spillover do mes vizinho

    public DayCell(int year, int month, int day, boolean inMonth) {
        this.year = year;
        this.month = month;
        this.day = day;
        this.inMonth = inMonth;
    }

    public int getYear()        { return year; }
    public int getMonth()       { return month; }
    public int getDay()         { return day; }
    public boolean isInMonth()  { return inMonth; }
}
