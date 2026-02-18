import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Clock, User, DollarSign } from "lucide-react";

interface Booking {
  id: string;
  event_date: string;
  status: string;
  total_amount: number;
  notes: string | null;
  client_id: string;
}

interface BookingCalendarProps {
  bookings: Booking[];
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const BookingCalendar = ({ bookings }: BookingCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const bookingsByDate = useMemo(() => {
    const map = new Map<string, Booking[]>();
    bookings.forEach(b => {
      const date = b.event_date;
      if (!map.has(date)) map.set(date, []);
      map.get(date)!.push(b);
    });
    return map;
  }, [bookings]);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  }, [firstDay, daysInMonth]);

  const formatDateKey = (day: number) => {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  };

  const todayKey = (() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
  })();

  const selectedBookings = selectedDate ? (bookingsByDate.get(selectedDate) ?? []) : [];

  const statusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-green-500";
      case "pending": return "bg-yellow-500";
      case "rejected": return "bg-destructive";
      case "completed": return "bg-primary";
      default: return "bg-muted-foreground";
    }
  };

  const upcomingBookings = bookings
    .filter(b => b.event_date >= todayKey && b.status !== "rejected")
    .sort((a, b) => a.event_date.localeCompare(b.event_date))
    .slice(0, 5);

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Calendar Grid */}
      <Card className="lg:col-span-2">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{MONTHS[month]} {year}</CardTitle>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={prevMonth}><ChevronLeft className="w-4 h-4" /></Button>
              <Button variant="ghost" size="icon" onClick={nextMonth}><ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-px">
            {DAYS.map(d => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
            ))}
            {calendarDays.map((day, i) => {
              if (day === null) return <div key={`empty-${i}`} />;
              const dateKey = formatDateKey(day);
              const dayBookings = bookingsByDate.get(dateKey) ?? [];
              const isToday = dateKey === todayKey;
              const isSelected = dateKey === selectedDate;
              const hasBookings = dayBookings.length > 0;

              return (
                <button
                  key={dateKey}
                  onClick={() => setSelectedDate(isSelected ? null : dateKey)}
                  className={`relative p-1 min-h-[60px] md:min-h-[80px] border border-border/50 rounded-lg text-left transition-colors
                    ${isToday ? "bg-primary/5 border-primary/30" : ""}
                    ${isSelected ? "bg-primary/10 border-primary ring-1 ring-primary" : "hover:bg-muted/50"}
                  `}
                >
                  <span className={`text-xs font-medium ${isToday ? "text-primary font-bold" : "text-foreground"}`}>{day}</span>
                  {hasBookings && (
                    <div className="mt-1 space-y-0.5">
                      {dayBookings.slice(0, 2).map(b => (
                        <div key={b.id} className={`h-1.5 rounded-full ${statusColor(b.status)}`} />
                      ))}
                      {dayBookings.length > 2 && (
                        <span className="text-[9px] text-muted-foreground">+{dayBookings.length - 2}</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex gap-4 mt-4 flex-wrap">
            {[["confirmed", "Confirmed"], ["pending", "Pending"], ["completed", "Completed"], ["rejected", "Rejected"]].map(([s, l]) => (
              <div key={s} className="flex items-center gap-1.5">
                <div className={`w-2.5 h-2.5 rounded-full ${statusColor(s)}`} />
                <span className="text-xs text-muted-foreground">{l}</span>
              </div>
            ))}
          </div>

          {/* Selected date details */}
          {selectedDate && (
            <div className="mt-4 border-t border-border pt-4">
              <h4 className="text-sm font-semibold text-foreground mb-3">
                {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </h4>
              {selectedBookings.length === 0 ? (
                <p className="text-sm text-muted-foreground">No bookings on this day</p>
              ) : (
                <div className="space-y-2">
                  {selectedBookings.map(b => (
                    <div key={b.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <Badge variant={b.status === "confirmed" ? "default" : "secondary"}>{b.status}</Badge>
                        {b.notes && <span className="text-xs text-muted-foreground truncate max-w-[200px]">{b.notes}</span>}
                      </div>
                      <span className="text-sm font-semibold text-primary">{(b.total_amount || 0).toLocaleString()} RWF</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming bookings sidebar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Upcoming</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingBookings.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No upcoming bookings</p>
          ) : (
            <div className="space-y-3">
              {upcomingBookings.map(b => (
                <div key={b.id} className="p-3 bg-muted rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant={b.status === "confirmed" ? "default" : "secondary"} className="text-xs">{b.status}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(b.event_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <DollarSign className="w-3 h-3" />
                    <span>{(b.total_amount || 0).toLocaleString()} RWF</span>
                  </div>
                  {b.notes && <p className="text-xs text-muted-foreground truncate">{b.notes}</p>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BookingCalendar;
