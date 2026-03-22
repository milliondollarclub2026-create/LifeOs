import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { 
  Plus, 
  Trash,
  Target,
  Calendar,
  Fire,
  Lightning
} from "@phosphor-icons/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const ProgressRing = ({ progress, size = 80, strokeWidth = 6 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="progress-ring">
      <circle stroke="#E5E7EB" fill="transparent" strokeWidth={strokeWidth} r={radius} cx={size / 2} cy={size / 2} />
      <circle stroke="#3B82F6" fill="transparent" strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} r={radius} cx={size / 2} cy={size / 2} style={{ transition: 'stroke-dashoffset 0.5s ease' }} />
    </svg>
  );
};

export default function LifeOS() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [habitDialogOpen, setHabitDialogOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [habitForm, setHabitForm] = useState({ name: '', category: 'general', color: '#3B82F6' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get(`${API}/life-os/summary`);
      setSummary(response.data);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddHabit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/habits`, habitForm);
      toast.success("Habit added");
      setHabitDialogOpen(false);
      setHabitForm({ name: '', category: 'general', color: '#3B82F6' });
      fetchData();
    } catch (error) { toast.error("Failed to add habit"); }
  };

  const handleDeleteHabit = async (habitId) => {
    try {
      await axios.delete(`${API}/habits/${habitId}`);
      toast.success("Habit deleted");
      fetchData();
    } catch (error) { toast.error("Failed to delete"); }
  };

  const handleToggleHabitLog = async (habitId, date) => {
    try {
      await axios.post(`${API}/habit-logs`, { habit_id: habitId, date, completed: true });
      fetchData();
    } catch (error) { toast.error("Failed to update"); }
  };

  const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  
  const today = new Date();
  const currentYear = today.getFullYear();

  const isHabitCompleted = (habitId, date) => {
    return summary?.logs?.some(log => log.habit_id === habitId && log.date === date && log.completed === 'True');
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center" data-testid="lifeos-loading">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent"></div>
      </div>
    );
  }

  const daysInMonth = getDaysInMonth(selectedMonth, currentYear);

  return (
    <div className="space-y-6" data-testid="lifeos-page">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Life OS</h1>
          <p className="text-sm text-muted-foreground mt-1">Track habits and build consistency</p>
        </div>
        <Dialog open={habitDialogOpen} onOpenChange={setHabitDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="add-habit-btn">
              <Plus size={16} weight="bold" />
              Add Habit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-heading">Add Habit</DialogTitle>
              <DialogDescription>Create a new habit to track</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddHabit} className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input placeholder="Morning exercise..." value={habitForm.name} onChange={(e) => setHabitForm({ ...habitForm, name: e.target.value })} required data-testid="habit-name-input" />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={habitForm.category} onValueChange={(v) => setHabitForm({ ...habitForm, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prayer">Prayer</SelectItem>
                    <SelectItem value="health">Health</SelectItem>
                    <SelectItem value="learning">Learning</SelectItem>
                    <SelectItem value="work">Work</SelectItem>
                    <SelectItem value="general">General</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full" data-testid="submit-habit-btn">Add Habit</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Progress Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="stat-card flex items-center gap-4">
          <div className="relative">
            <ProgressRing progress={summary?.year_progress || 0} size={64} strokeWidth={5} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-heading text-sm font-bold number-display">{Math.round(summary?.year_progress || 0)}%</span>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Year</p>
            <p className="text-lg font-bold number-display">{summary?.days_passed || 0} <span className="text-sm font-normal text-muted-foreground">days</span></p>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-secondary"><Calendar size={18} className="text-primary" /></div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Month Left</p>
              <p className="font-heading text-2xl font-bold text-primary number-display">{summary?.days_remaining_month || 0}</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-secondary"><Target size={18} className="text-primary" /></div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Year Left</p>
              <p className="font-heading text-2xl font-bold text-primary number-display">{summary?.days_remaining_year || 0}</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-secondary"><Lightning size={18} className="text-primary" /></div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Overall Streak</p>
              <p className="font-heading text-2xl font-bold text-primary number-display">{summary?.overall_streak || 0} <span className="text-sm font-normal text-muted-foreground">days</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Habit Tracker Grid */}
      <Card className="card-clean" data-testid="habit-tracker">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="font-heading text-base font-semibold flex items-center gap-2">
              <Fire size={18} className="text-muted-foreground" />
              Habit Tracker
            </CardTitle>
            <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
              <SelectTrigger className="w-24" data-testid="month-select"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MONTHS.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {summary?.habits?.length > 0 ? (
            <div className="overflow-x-auto">
              {/* Header Row */}
              <div className="flex items-center min-w-max border-b border-border pb-2 mb-3">
                <div className="w-40 shrink-0 pr-4">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Habit</span>
                </div>
                <div className="flex-1 flex gap-[2px]">
                  {Array.from({ length: daysInMonth }).map((_, i) => (
                    <div key={i} className="w-6 flex-shrink-0 text-center text-[10px] text-muted-foreground font-medium">
                      {i + 1}
                    </div>
                  ))}
                </div>
                <div className="w-16 pl-2 text-center">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Rate</span>
                </div>
                <div className="w-16 pl-2 text-center">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Streak</span>
                </div>
              </div>

              {/* Habit Rows */}
              <div className="space-y-1">
                {summary.habits.map((habit) => (
                  <div key={habit.id} className="flex items-center min-w-max py-2 hover:bg-secondary/30 rounded-lg transition-colors">
                    <div className="w-40 shrink-0 pr-4 flex items-center gap-2">
                      <button onClick={() => handleDeleteHabit(habit.id)} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100" data-testid={`delete-habit-${habit.id}`}>
                        <Trash size={12} />
                      </button>
                      <span className="text-sm font-medium truncate">{habit.name}</span>
                    </div>
                    <div className="flex-1 flex gap-[2px]">
                      {Array.from({ length: daysInMonth }).map((_, dayIndex) => {
                        const day = dayIndex + 1;
                        const dateStr = `${currentYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const isCompleted = isHabitCompleted(habit.id, dateStr);
                        const isToday = today.getMonth() === selectedMonth && today.getDate() === day;
                        const isFuture = new Date(dateStr) > today;
                        const isPast = new Date(dateStr) < new Date(today.toDateString());

                        return (
                          <div key={dayIndex} className="w-6 flex-shrink-0 flex items-center justify-center">
                            <button
                              onClick={() => !isFuture && handleToggleHabitLog(habit.id, dateStr)}
                              disabled={isFuture}
                              className={`habit-dot ${isCompleted ? 'completed' : ''} ${isToday ? 'today' : ''} ${!isCompleted && isPast ? 'missed' : ''} ${isFuture ? 'future' : ''}`}
                              data-testid={`habit-${habit.id}-day-${day}`}
                            />
                          </div>
                        );
                      })}
                    </div>
                    <div className="w-16 pl-2 text-center">
                      <span className="text-sm font-semibold text-primary number-display">{habit.completion_rate}%</span>
                    </div>
                    <div className="w-16 pl-2 text-center">
                      <span className="text-sm font-semibold number-display flex items-center justify-center gap-1">
                        {habit.streak > 0 && <Fire size={12} className="text-orange-500" weight="fill" />}
                        {habit.streak}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-6 mt-6 pt-4 border-t border-border">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="habit-dot completed w-4 h-4" style={{ background: '#3B82F6', borderColor: '#3B82F6' }} />
                  <span>Completed</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-4 h-4 rounded-full border-2 border-border bg-white" />
                  <span>Not done</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-4 h-4 rounded-full border-2 border-primary" />
                  <span>Today</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-4 h-4 rounded-full border-2 border-destructive/40 bg-destructive/5" />
                  <span>Missed</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-40 items-center justify-center text-muted-foreground text-sm">
              <p>No habits yet. Add your first habit to start tracking!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Habits Overview Cards */}
      {summary?.habits?.length > 0 && (
        <div>
          <h2 className="font-heading text-lg font-semibold mb-4">Habits Overview</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {summary.habits.map((habit) => (
              <div key={habit.id} className="p-4 rounded-xl border border-border bg-white hover:border-primary/30 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium text-sm">{habit.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{habit.category}</p>
                  </div>
                  <button onClick={() => handleDeleteHabit(habit.id)} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash size={14} />
                  </button>
                </div>
                
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Rate</p>
                    <p className="font-semibold text-primary number-display">{habit.completion_rate}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Streak</p>
                    <p className="font-semibold number-display flex items-center justify-center gap-1">
                      {habit.streak > 0 && <Fire size={12} className="text-orange-500" weight="fill" />}
                      {habit.streak}d
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Total</p>
                    <p className="font-semibold number-display">{habit.total_completions}</p>
                  </div>
                </div>
                
                {/* Mini progress bar */}
                <div className="mt-3 h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(habit.completion_rate, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
