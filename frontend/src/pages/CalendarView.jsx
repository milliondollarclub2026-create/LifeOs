import { useState, useEffect } from "react";
import axios from "axios";
import { 
  CaretLeft, 
  CaretRight,
  TrendUp,
  TrendDown
} from "@phosphor-icons/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
  const monthlyIncome = Object.entries(calendarData)
    .filter(([date]) => date.startsWith(`${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`))
    .reduce((sum, [, data]) => sum + (data.income || 0), 0);
  
  const monthlyExpenses = Object.entries(calendarData)
    .filter(([date]) => date.startsWith(`${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`))
    .reduce((sum, [, data]) => sum + (data.expenses || 0), 0);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center" data-testid="calendar-loading">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="calendar-page">
      {/* Header */}
      <div>
        <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground">
          Calendar
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          View your income and expenses by date
        </p>
      </div>

      {/* Monthly Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-blue-50 border-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="icon-container bg-blue-100 p-2">
                <TrendUp size={20} className="text-blue-600" weight="bold" />
              </div>
              <div>
                <p className="text-xs text-blue-700 font-medium">Monthly Income</p>
                <p className="font-heading text-2xl font-bold text-blue-900 matrix-number">
                  {formatCurrency(monthlyIncome)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="icon-container bg-red-100 p-2">
                <TrendDown size={20} className="text-red-600" weight="bold" />
              </div>
              <div>
                <p className="text-xs text-red-700 font-medium">Monthly Expenses</p>
                <p className="font-heading text-2xl font-bold text-red-900 matrix-number">
                  {formatCurrency(monthlyExpenses)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={`${monthlyIncome - monthlyExpenses >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-orange-50 border-orange-100'}`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`icon-container p-2 ${monthlyIncome - monthlyExpenses >= 0 ? 'bg-emerald-100' : 'bg-orange-100'}`}>
                <TrendUp size={20} className={monthlyIncome - monthlyExpenses >= 0 ? 'text-emerald-600' : 'text-orange-600'} weight="bold" />
              </div>
              <div>
                <p className={`text-xs font-medium ${monthlyIncome - monthlyExpenses >= 0 ? 'text-emerald-700' : 'text-orange-700'}`}>Monthly Savings</p>
                <p className={`font-heading text-2xl font-bold matrix-number ${monthlyIncome - monthlyExpenses >= 0 ? 'text-emerald-900' : 'text-orange-900'}`}>
                  {formatCurrency(monthlyIncome - monthlyExpenses)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar */}
        <Card className="lg:col-span-2" data-testid="calendar-grid">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="font-heading text-xl font-semibold">
                {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={goToPrevMonth} className="btn-press" data-testid="prev-month">
                  <CaretLeft size={20} />
                </Button>
                <Button variant="outline" size="icon" onClick={goToNextMonth} className="btn-press" data-testid="next-month">
                  <CaretRight size={20} />
                </Button>
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
              {/* Empty cells for days before the first day of month */}
              {Array.from({ length: startingDay }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square" />
              ))}
              
              {/* Days of the month */}
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
                    className={`
                      aspect-square p-1 rounded-lg transition-all text-sm font-medium
                      ${isToday(day) ? 'ring-2 ring-primary ring-offset-2' : ''}
                      ${isSelected ? 'bg-primary text-white' : 'hover:bg-secondary'}
                      ${!isSelected && (hasIncome || hasExpense) ? 'bg-secondary/50' : ''}
                    `}
                    data-testid={`calendar-day-${day}`}
                  >
                    <div className="flex flex-col items-center justify-center h-full">
                      <span>{day}</span>
                      {(hasIncome || hasExpense) && !isSelected && (
                        <div className="flex gap-0.5 mt-1">
                          {hasIncome && <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                          {hasExpense && <div className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-6 mt-6 pt-4 border-t border-border">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span>Income</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span>Expense</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Day Details */}
        <Card data-testid="day-details">
          <CardHeader className="pb-3">
            <CardTitle className="font-heading text-lg font-semibold">
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
                      <TrendUp size={16} className="text-blue-600" weight="bold" />
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Income</p>
                    </div>
                    <div className="space-y-2">
                      {selectedDateData.income_items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-3 rounded-lg bg-blue-50">
                          <div>
                            <p className="font-medium text-sm">{item.description}</p>
                            <p className="text-xs text-muted-foreground capitalize">{item.source}</p>
                          </div>
                          <p className="font-heading font-semibold text-blue-600 matrix-number">
                            +{formatCurrency(item.amount)}
                          </p>
                        </div>
                      ))}
                    </div>
                    <p className="text-right mt-2 font-semibold text-blue-600">
                      Total: {formatCurrency(selectedDateData.income)}
                    </p>
                  </div>
                )}

                {/* Expenses Section */}
                {selectedDateData.expense_items?.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <TrendDown size={16} className="text-red-500" weight="bold" />
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Expenses</p>
                    </div>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {selectedDateData.expense_items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-3 rounded-lg bg-red-50">
                          <div>
                            <p className="font-medium text-sm">{item.description}</p>
                            <p className="text-xs text-muted-foreground capitalize">{item.category}</p>
                          </div>
                          <p className="font-heading font-semibold text-red-500 matrix-number">
                            -{formatCurrency(item.amount)}
                          </p>
                        </div>
                      ))}
                    </div>
                    <p className="text-right mt-2 font-semibold text-red-500">
                      Total: {formatCurrency(selectedDateData.expenses)}
                    </p>
                  </div>
                )}

                {/* Net for the day */}
                <div className="pt-4 border-t border-border">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium text-muted-foreground">Net for the day</p>
                    <p className={`font-heading text-xl font-bold matrix-number ${
                      (selectedDateData.income - selectedDateData.expenses) >= 0 
                        ? 'text-blue-600' 
                        : 'text-red-500'
                    }`}>
                      {formatCurrency(selectedDateData.income - selectedDateData.expenses)}
                    </p>
                  </div>
                </div>
              </div>
            ) : selectedDate ? (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                <p>No transactions on this date</p>
              </div>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                <p>Click on a date to see details</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
