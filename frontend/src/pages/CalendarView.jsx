import { useState, useEffect } from "react";
import axios from "axios";
import { 
  CaretLeft, 
  CaretRight,
  TrendUp,
  TrendDown
} from "@phosphor-icons/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function CalendarView() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get(`${API}/dashboard/summary`);
      setSummary(response.data);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    return { daysInMonth, startingDay };
  };

  const { daysInMonth, startingDay } = getDaysInMonth(currentDate);
  const calendarData = summary?.calendar_data || {};

  const goToPrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    setSelectedDate(null);
  };

  const getDateKey = (day) => {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    return `${year}-${month}-${dayStr}`;
  };

  const today = new Date();
  const isToday = (day) => {
    return today.getFullYear() === currentDate.getFullYear() &&
           today.getMonth() === currentDate.getMonth() &&
           today.getDate() === day;
  };

  const selectedDateData = selectedDate ? calendarData[getDateKey(selectedDate)] : null;

  // Calculate monthly totals
  const monthPrefix = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
  const monthlyIncome = Object.entries(calendarData)
    .filter(([date]) => date.startsWith(monthPrefix))
    .reduce((sum, [, data]) => sum + (data.income || 0), 0);
  
  const monthlyExpenses = Object.entries(calendarData)
    .filter(([date]) => date.startsWith(monthPrefix))
    .reduce((sum, [, data]) => sum + (data.expenses || 0), 0);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center" data-testid="calendar-loading">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="calendar-page">
      {/* Header */}
      <div>
        <h1 className="font-heading text-3xl font-bold text-foreground">Calendar</h1>
        <p className="text-sm text-muted-foreground mt-1">Track daily income and expenses</p>
      </div>

      {/* Monthly Summary - Clean cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary">
              <TrendUp size={20} className="text-primary" weight="bold" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Monthly Income</p>
              <p className="font-heading text-2xl font-bold text-primary number-display">
                {formatCurrency(monthlyIncome)}
              </p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary">
              <TrendDown size={20} className="text-destructive" weight="bold" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Monthly Expenses</p>
              <p className="font-heading text-2xl font-bold text-destructive number-display">
                {formatCurrency(monthlyExpenses)}
              </p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary">
              <TrendUp size={20} className={monthlyIncome - monthlyExpenses >= 0 ? 'text-primary' : 'text-destructive'} weight="bold" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Monthly Savings</p>
              <p className={`font-heading text-2xl font-bold number-display ${monthlyIncome - monthlyExpenses >= 0 ? 'text-primary' : 'text-destructive'}`}>
                {formatCurrency(monthlyIncome - monthlyExpenses)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar */}
        <Card className="lg:col-span-2 card-clean" data-testid="calendar-grid">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="font-heading text-lg font-semibold">
                {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
              </CardTitle>
              <div className="flex gap-1">
                <button onClick={goToPrevMonth} className="pagination-btn" data-testid="prev-month">
                  <CaretLeft size={16} weight="bold" />
                </button>
                <button onClick={goToNextMonth} className="pagination-btn" data-testid="next-month">
                  <CaretRight size={16} weight="bold" />
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {WEEKDAYS.map(day => (
                <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>
            
            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: startingDay }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateKey = getDateKey(day);
                const dayData = calendarData[dateKey];
                const hasIncome = dayData?.income > 0;
                const hasExpense = dayData?.expenses > 0;
                const isSelected = selectedDate === day;
                
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(isSelected ? null : day)}
                    className={`calendar-day ${isSelected ? 'selected' : ''} ${isToday(day) ? 'today' : ''}`}
                    data-testid={`calendar-day-${day}`}
                  >
                    <span>{day}</span>
                    {/* Amount indicator bar */}
                    {(hasIncome || hasExpense) && !isSelected && (
                      <div className={`calendar-indicator ${hasIncome && hasExpense ? 'both' : hasIncome ? 'income' : 'expense'}`} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-6 mt-6 pt-4 border-t border-border">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-4 h-1 rounded bg-primary" />
                <span>Income</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-4 h-1 rounded bg-destructive" />
                <span>Expense</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Day Details */}
        <Card className="card-clean" data-testid="day-details">
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-base font-semibold">
              {selectedDate 
                ? `${MONTHS[currentDate.getMonth()]} ${selectedDate}, ${currentDate.getFullYear()}`
                : 'Select a date'
              }
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDate && selectedDateData ? (
              <div className="space-y-4">
                {/* Income Section */}
                {selectedDateData.income_items?.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <TrendUp size={14} className="text-primary" weight="bold" />
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Income</p>
                    </div>
                    <div className="space-y-2">
                      {selectedDateData.income_items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-2.5 rounded-lg border border-border">
                          <div>
                            <p className="font-medium text-sm">{item.description}</p>
                            <p className="text-xs text-muted-foreground capitalize">{item.source}</p>
                          </div>
                          <p className="font-semibold text-primary number-display">
                            +{formatCurrency(item.amount)}
                          </p>
                        </div>
                      ))}
                    </div>
                    <p className="text-right mt-2 font-semibold text-sm text-primary">
                      Total: {formatCurrency(selectedDateData.income)}
                    </p>
                  </div>
                )}

                {/* Expenses Section */}
                {selectedDateData.expense_items?.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <TrendDown size={14} className="text-destructive" weight="bold" />
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Expenses</p>
                    </div>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {selectedDateData.expense_items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-2.5 rounded-lg border border-border">
                          <div>
                            <p className="font-medium text-sm">{item.description}</p>
                            <p className="text-xs text-muted-foreground capitalize">{item.category}</p>
                          </div>
                          <p className="font-semibold text-destructive number-display">
                            -{formatCurrency(item.amount)}
                          </p>
                        </div>
                      ))}
                    </div>
                    <p className="text-right mt-2 font-semibold text-sm text-destructive">
                      Total: {formatCurrency(selectedDateData.expenses)}
                    </p>
                  </div>
                )}

                {/* Net for the day */}
                <div className="pt-3 border-t border-border">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium text-muted-foreground">Net</p>
                    <p className={`font-heading text-xl font-bold number-display ${
                      (selectedDateData.income - selectedDateData.expenses) >= 0 ? 'text-primary' : 'text-destructive'
                    }`}>
                      {formatCurrency(selectedDateData.income - selectedDateData.expenses)}
                    </p>
                  </div>
                </div>
              </div>
            ) : selectedDate ? (
              <div className="flex h-[250px] items-center justify-center text-muted-foreground text-sm">
                <p>No transactions</p>
              </div>
            ) : (
              <div className="flex h-[250px] items-center justify-center text-muted-foreground text-sm">
                <p>Click a date to view details</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
