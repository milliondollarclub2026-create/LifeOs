import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { 
  Plus, 
  Trash,
  Target,
  Calendar,
  Fire,
  Trophy
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
import { 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from "recharts";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const ProgressRing = ({ progress, size = 100, strokeWidth = 8 }) => {
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
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  const [habitForm, setHabitForm] = useState({ name: '', category: 'general', color: '#3B82F6' });
  const [goalForm, setGoalForm] = useState({ title: '', goal_type: 'daily', target_value: '' });

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

  const handleAddGoal = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/goals`, { ...goalForm, target_value: goalForm.target_value ? parseInt(goalForm.target_value) : null });
      toast.success("Goal added");
      setGoalDialogOpen(false);
      setGoalForm({ title: '', goal_type: 'daily', target_value: '' });
      fetchData();
    } catch (error) { toast.error("Failed to add goal"); }
  };

  const handleDeleteGoal = async (goalId) => {
    try {
      await axios.delete(`${API}/goals/${goalId}`);
      toast.success("Goal deleted");
      fetchData();
    } catch (error) { toast.error("Failed to delete"); }
  };

  const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate();
  
  const today = new Date();
  const currentYear = today.getFullYear();

  const isHabitCompleted = (habitId, date) => {
    return summary?.logs?.some(log => log.habit_id === habitId && log.date === date && log.completed === 'True');
  };

  // Habit completion chart data
  const habitChartData = useMemo(() => {
    if (!summary?.habits?.length) return [];
    return summary.habits.map(h => ({
      name: h.name.length > 12 ? h.name.substring(0, 12) + '...' : h.name,
      rate: h.completion_rate,
      color: h.color
    }));
  }, [summary]);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center" data-testid="lifeos-loading">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
        </div>
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
          <p className="text-sm text-muted-foreground mt-1">Track habits and achieve goals</p>
        </div>
        <div className="flex gap-2">
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

          <Dialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2" data-testid="add-goal-btn">
                <Target size={16} weight="bold" />
                Add Goal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-heading">Add Goal</DialogTitle>
                <DialogDescription>Set a new goal</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddGoal} className="space-y-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input placeholder="Read 50 books..." value={goalForm.title} onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })} required data-testid="goal-title-input" />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={goalForm.goal_type} onValueChange={(v) => setGoalForm({ ...goalForm, goal_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="annual">Annual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Target (optional)</Label>
                  <Input type="number" placeholder="50" value={goalForm.target_value} onChange={(e) => setGoalForm({ ...goalForm, target_value: e.target.value })} />
                </div>
                <Button type="submit" className="w-full" data-testid="submit-goal-btn">Add Goal</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Progress Stats - Clean */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="stat-card flex items-center gap-4">
          <div className="relative">
            <ProgressRing progress={summary?.year_progress || 0} size={72} strokeWidth={6} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-heading text-base font-bold number-display">{Math.round(summary?.year_progress || 0)}%</span>
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Year Progress</p>
            <p className="text-xl font-bold number-display">{summary?.days_passed || 0} <span className="text-sm font-normal text-muted-foreground">days</span></p>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-secondary">
              <Calendar size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Days Left (Month)</p>
              <p className="font-heading text-2xl font-bold text-primary number-display">{summary?.days_remaining_month || 0}</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-secondary">
              <Target size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Days Left (Year)</p>
              <p className="font-heading text-2xl font-bold text-primary number-display">{summary?.days_remaining_year || 0}</p>
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-secondary">
              <Fire size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Today</p>
              <p className="font-heading text-2xl font-bold text-primary number-display">{summary?.today_completed || 0}<span className="text-lg text-muted-foreground">/{summary?.total_habits || 0}</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Habit Tracker - Full Width Grid */}
      <Card className="card-clean" data-testid="habit-tracker">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="font-heading text-base font-semibold flex items-center gap-2">
              <Target size={18} className="text-muted-foreground" />
              Habit Tracker - {currentYear}
            </CardTitle>
            <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
              <SelectTrigger className="w-28" data-testid="month-select"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MONTHS.map((m, i) => <SelectItem key={i} value={String(i)}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {summary?.habits?.length > 0 ? (
            <div className="overflow-x-auto">
              {/* Days header */}
              <div className="flex items-center gap-0 min-w-max">
                <div className="w-36 shrink-0 pr-3 text-right">
                  <span className="text-xs font-semibold text-muted-foreground">HABIT</span>
                </div>
                <div className="flex-1 flex">
                  {Array.from({ length: daysInMonth }).map((_, i) => (
                    <div key={i} className="w-7 flex-shrink-0 text-center text-xs text-muted-foreground font-medium">
                      {i + 1}
                    </div>
                  ))}
                </div>
                <div className="w-16 pl-3 text-center">
                  <span className="text-xs font-semibold text-muted-foreground">RATE</span>
                </div>
              </div>

              {/* Habits */}
              <div className="mt-3 space-y-2">
                {summary.habits.map((habit) => (
                  <div key={habit.id} className="flex items-center gap-0 min-w-max py-1.5 border-b border-border last:border-0">
                    <div className="w-36 shrink-0 pr-3 flex items-center justify-end gap-2">
                      <span className="text-sm font-medium truncate text-right">{habit.name}</span>
                      <button onClick={() => handleDeleteHabit(habit.id)} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" data-testid={`delete-habit-${habit.id}`}>
                        <Trash size={12} />
                      </button>
                    </div>
                    <div className="flex-1 flex">
                      {Array.from({ length: daysInMonth }).map((_, dayIndex) => {
                        const day = dayIndex + 1;
                        const dateStr = `${currentYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const isCompleted = isHabitCompleted(habit.id, dateStr);
                        const isToday = today.getMonth() === selectedMonth && today.getDate() === day;
                        const isFuture = new Date(dateStr) > today;
                        const isPast = new Date(dateStr) < new Date(today.toDateString());

                        return (
                          <div key={dayIndex} className="w-7 flex-shrink-0 flex items-center justify-center">
                            <button
                              onClick={() => !isFuture && handleToggleHabitLog(habit.id, dateStr)}
                              disabled={isFuture}
                              className={`habit-dot ${isCompleted ? 'completed' : ''} ${isToday ? 'today' : ''} ${!isCompleted && isPast ? 'missed' : ''} ${isFuture ? 'opacity-20 cursor-not-allowed' : ''}`}
                              data-testid={`habit-${habit.id}-day-${day}`}
                            />
                          </div>
                        );
                      })}
                    </div>
                    <div className="w-16 pl-3 text-center">
                      <span className="text-sm font-semibold text-primary number-display">{habit.completion_rate}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center text-muted-foreground text-sm">
              <p>No habits yet. Add your first habit!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chart and Goals */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Habit Completion Chart */}
        <Card className="card-clean" data-testid="completion-chart">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-base font-semibold flex items-center gap-2">
              <Trophy size={18} className="text-muted-foreground" />
              Completion Rates
            </CardTitle>
          </CardHeader>
          <CardContent>
            {habitChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={habitChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={true} vertical={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} unit="%" />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} width={90} />
                  <Tooltip formatter={(value) => `${value}%`} contentStyle={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '8px' }} />
                  <Bar dataKey="rate" radius={[0, 4, 4, 0]} name="Completion Rate">
                    {habitChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[250px] items-center justify-center text-muted-foreground text-sm">
                <p>Add habits to see completion rates</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Goals */}
        <Card className="card-clean" data-testid="goals-card">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-base font-semibold flex items-center gap-2">
              <Target size={18} className="text-muted-foreground" />
              Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            {summary?.goals?.length > 0 ? (
              <div className="space-y-2 max-h-[260px] overflow-y-auto">
                {summary.goals.map((goal) => (
                  <div key={goal.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-secondary">
                        {goal.goal_type === 'daily' ? <Fire size={16} className="text-primary" /> : <Trophy size={16} className="text-primary" />}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{goal.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">{goal.goal_type} goal</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {goal.target_value > 0 && <span className="text-xs text-muted-foreground">{goal.current_value}/{goal.target_value}</span>}
                      <button onClick={() => handleDeleteGoal(goal.id)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" data-testid={`delete-goal-${goal.id}`}>
                        <Trash size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-[260px] items-center justify-center text-muted-foreground text-sm">
                <p>No goals yet. Set your first goal!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
