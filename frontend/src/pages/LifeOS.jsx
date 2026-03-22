import { useState, useEffect } from "react";
import axios from "axios";
import { 
  Plus, 
  Trash,
  Check,
  Target,
  Calendar,
  Fire,
  Trophy,
  Moon
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
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from "recharts";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4', '#EF4444'];

const ProgressRing = ({ progress, size = 120, strokeWidth = 8, color = "#3B82F6" }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="progress-ring">
      <circle
        stroke="#E2E8F0"
        fill="transparent"
        strokeWidth={strokeWidth}
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
      <circle
        stroke={color}
        fill="transparent"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        r={radius}
        cx={size / 2}
        cy={size / 2}
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
    </svg>
  );
};

export default function LifeOS() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [habitDialogOpen, setHabitDialogOpen] = useState(false);
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  const [habitForm, setHabitForm] = useState({
    name: '',
    category: 'general',
    color: '#3B82F6'
  });

  const [goalForm, setGoalForm] = useState({
    title: '',
    goal_type: 'daily',
    target_value: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

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
      toast.success("Habit added successfully");
      setHabitDialogOpen(false);
      setHabitForm({ name: '', category: 'general', color: '#3B82F6' });
      fetchData();
    } catch (error) {
      toast.error("Failed to add habit");
    }
  };

  const handleDeleteHabit = async (habitId) => {
    try {
      await axios.delete(`${API}/habits/${habitId}`);
      toast.success("Habit deleted");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete habit");
    }
  };

  const handleToggleHabitLog = async (habitId, date) => {
    try {
      await axios.post(`${API}/habit-logs`, { habit_id: habitId, date, completed: true });
      fetchData();
    } catch (error) {
      toast.error("Failed to update habit");
    }
  };

  const handleAddGoal = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/goals`, {
        ...goalForm,
        target_value: goalForm.target_value ? parseInt(goalForm.target_value) : null
      });
      toast.success("Goal added successfully");
      setGoalDialogOpen(false);
      setGoalForm({ title: '', goal_type: 'daily', target_value: '' });
      fetchData();
    } catch (error) {
      toast.error("Failed to add goal");
    }
  };

  const handleDeleteGoal = async (goalId) => {
    try {
      await axios.delete(`${API}/goals/${goalId}`);
      toast.success("Goal deleted");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete goal");
    }
  };

  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const today = new Date();
  const currentYear = today.getFullYear();

  const isHabitCompleted = (habitId, date) => {
    return summary?.logs?.some(log => 
      log.habit_id === habitId && log.date === date && log.completed === 'True'
    );
  };

  // Generate completion chart data
  const getCompletionChartData = () => {
    if (!summary?.habits?.length || !summary?.logs?.length) return [];
    
    const monthlyData = [];
    for (let month = 0; month <= today.getMonth(); month++) {
      const daysInMonth = getDaysInMonth(month, currentYear);
      const monthStart = `${currentYear}-${String(month + 1).padStart(2, '0')}-01`;
      const monthEnd = `${currentYear}-${String(month + 1).padStart(2, '0')}-${daysInMonth}`;
      
      const logsInMonth = summary.logs.filter(log => 
        log.date >= monthStart && log.date <= monthEnd && log.completed === 'True'
      );
      
      const maxPossible = daysInMonth * summary.habits.length;
      const completionRate = maxPossible > 0 ? (logsInMonth.length / maxPossible) * 100 : 0;
      
      monthlyData.push({
        month: MONTHS[month],
        completions: logsInMonth.length,
        rate: Math.round(completionRate)
      });
    }
    return monthlyData;
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center" data-testid="lifeos-loading">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading Life OS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="lifeos-page">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground">
            Life OS
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track your habits and achieve your goals
          </p>
        </div>
        <div className="flex gap-3">
          <Dialog open={habitDialogOpen} onOpenChange={setHabitDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 btn-press" data-testid="add-habit-btn">
                <Plus size={18} weight="bold" />
                Add Habit
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-heading">Add New Habit</DialogTitle>
                <DialogDescription>Create a habit to track daily</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddHabit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Habit Name</Label>
                  <Input
                    placeholder="e.g., Morning Exercise"
                    value={habitForm.name}
                    onChange={(e) => setHabitForm({ ...habitForm, name: e.target.value })}
                    required
                    data-testid="habit-name-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select 
                    value={habitForm.category} 
                    onValueChange={(value) => setHabitForm({ ...habitForm, category: value })}
                  >
                    <SelectTrigger data-testid="habit-category-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prayer">Prayer</SelectItem>
                      <SelectItem value="health">Health</SelectItem>
                      <SelectItem value="learning">Learning</SelectItem>
                      <SelectItem value="work">Work</SelectItem>
                      <SelectItem value="general">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex gap-2">
                    {COLORS.map(color => (
                      <button
                        key={color}
                        type="button"
                        className={`w-8 h-8 rounded-full transition-transform ${habitForm.color === color ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setHabitForm({ ...habitForm, color })}
                      />
                    ))}
                  </div>
                </div>
                <Button type="submit" className="w-full" data-testid="submit-habit-btn">
                  Add Habit
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={goalDialogOpen} onOpenChange={setGoalDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2 btn-press" data-testid="add-goal-btn">
                <Target size={18} weight="bold" />
                Add Goal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-heading">Add New Goal</DialogTitle>
                <DialogDescription>Set a daily or annual goal</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddGoal} className="space-y-4">
                <div className="space-y-2">
                  <Label>Goal Title</Label>
                  <Input
                    placeholder="e.g., Read 50 books this year"
                    value={goalForm.title}
                    onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
                    required
                    data-testid="goal-title-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Goal Type</Label>
                  <Select 
                    value={goalForm.goal_type} 
                    onValueChange={(value) => setGoalForm({ ...goalForm, goal_type: value })}
                  >
                    <SelectTrigger data-testid="goal-type-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily Goal</SelectItem>
                      <SelectItem value="annual">Annual Goal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Target (optional)</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 50"
                    value={goalForm.target_value}
                    onChange={(e) => setGoalForm({ ...goalForm, target_value: e.target.value })}
                    data-testid="goal-target-input"
                  />
                </div>
                <Button type="submit" className="w-full" data-testid="submit-goal-btn">
                  Add Goal
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Progress Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="card-hover">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="relative">
              <ProgressRing progress={summary?.year_progress || 0} size={80} strokeWidth={6} />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-heading text-lg font-bold matrix-number">
                  {Math.round(summary?.year_progress || 0)}%
                </span>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Year Progress</p>
              <p className="text-2xl font-bold matrix-number">{summary?.days_passed || 0}</p>
              <p className="text-xs text-muted-foreground">days completed</p>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="icon-container bg-orange-50 p-3">
                <Calendar size={24} weight="duotone" className="text-orange-500" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Days Left (Month)</p>
                <p className="font-heading text-3xl font-bold text-orange-500 matrix-number">
                  {summary?.days_remaining_month || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="icon-container bg-violet-50 p-3">
                <Moon size={24} weight="duotone" className="text-violet-500" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Days Left (Year)</p>
                <p className="font-heading text-3xl font-bold text-violet-500 matrix-number">
                  {summary?.days_remaining_year || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="icon-container bg-emerald-50 p-3">
                <Fire size={24} weight="duotone" className="text-emerald-500" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Today's Progress</p>
                <p className="font-heading text-3xl font-bold text-emerald-500 matrix-number">
                  {summary?.today_completed || 0}/{summary?.total_habits || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Habit Tracker Grid */}
      <Card data-testid="habit-tracker">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="font-heading text-xl font-semibold flex items-center gap-2">
              <Target size={24} weight="duotone" className="text-muted-foreground" />
              Habit Tracker - {currentYear}
            </CardTitle>
            <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
              <SelectTrigger className="w-32" data-testid="month-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((month, idx) => (
                  <SelectItem key={idx} value={String(idx)}>{month}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {summary?.habits?.length > 0 ? (
            <div className="space-y-4">
              {/* Days header */}
              <div className="flex items-center gap-2">
                <div className="w-40 shrink-0" />
                <div className="flex gap-1 overflow-x-auto pb-2">
                  {Array.from({ length: getDaysInMonth(selectedMonth, currentYear) }).map((_, i) => (
                    <div 
                      key={i} 
                      className="w-5 h-5 flex items-center justify-center text-[10px] text-muted-foreground shrink-0"
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>
              </div>

              {/* Habits grid */}
              {summary.habits.map((habit, habitIndex) => {
                const daysInMonth = getDaysInMonth(selectedMonth, currentYear);
                
                return (
                  <div key={habit.id} className="flex items-center gap-2">
                    <div className="w-40 shrink-0 flex items-center justify-between pr-2">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full shrink-0" 
                          style={{ backgroundColor: habit.color }}
                        />
                        <span className="text-sm font-medium truncate">{habit.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-red-500"
                        onClick={() => handleDeleteHabit(habit.id)}
                        data-testid={`delete-habit-${habit.id}`}
                      >
                        <Trash size={14} />
                      </Button>
                    </div>
                    <div className="flex gap-1 overflow-x-auto">
                      {Array.from({ length: daysInMonth }).map((_, dayIndex) => {
                        const day = dayIndex + 1;
                        const dateStr = `${currentYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const isCompleted = isHabitCompleted(habit.id, dateStr);
                        const isToday = today.getMonth() === selectedMonth && today.getDate() === day;
                        const isPast = new Date(dateStr) < new Date(today.toDateString());
                        const isFuture = new Date(dateStr) > today;

                        return (
                          <button
                            key={dayIndex}
                            onClick={() => !isFuture && handleToggleHabitLog(habit.id, dateStr)}
                            disabled={isFuture}
                            className={`
                              habit-dot shrink-0
                              ${isCompleted ? 'completed' : ''}
                              ${isToday ? 'today' : ''}
                              ${isFuture ? 'opacity-30 cursor-not-allowed' : ''}
                              ${!isCompleted && isPast ? 'border-red-200' : ''}
                            `}
                            style={isCompleted ? { backgroundColor: habit.color, borderColor: habit.color } : {}}
                            data-testid={`habit-${habit.id}-day-${day}`}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Completion rate per habit */}
              <div className="mt-6 pt-4 border-t border-border">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Completion Rates</p>
                <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                  {summary.habits.map(habit => (
                    <div key={habit.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: habit.color }} />
                        <span className="text-sm font-medium">{habit.name}</span>
                      </div>
                      <span className="font-heading font-semibold matrix-number" style={{ color: habit.color }}>
                        {habit.completion_rate}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-40 items-center justify-center text-muted-foreground">
              <p>No habits yet. Add your first habit to start tracking!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charts and Goals */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Completion Chart */}
        <Card className="card-hover" data-testid="completion-chart">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-lg font-semibold flex items-center gap-2">
              <Trophy size={20} weight="duotone" className="text-muted-foreground" />
              Monthly Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            {getCompletionChartData().length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={getCompletionChartData()}>
                  <defs>
                    <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748B' }} unit="%" />
                  <Tooltip 
                    formatter={(value, name) => [name === 'rate' ? `${value}%` : value, name === 'rate' ? 'Completion Rate' : 'Completions']}
                    contentStyle={{
                      background: 'white',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="rate" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    fill="url(#colorRate)"
                    name="Completion Rate"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[250px] items-center justify-center text-muted-foreground">
                <p>Start tracking habits to see your progress</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Goals */}
        <Card className="card-hover" data-testid="goals-card">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-lg font-semibold flex items-center gap-2">
              <Target size={20} weight="duotone" className="text-muted-foreground" />
              Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            {summary?.goals?.length > 0 ? (
              <div className="space-y-3 max-h-[280px] overflow-y-auto">
                {summary.goals.map((goal, index) => (
                  <div 
                    key={goal.id} 
                    className="flex items-center justify-between p-4 rounded-lg border border-border bg-white transition-all hover:shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`icon-container p-2 ${goal.goal_type === 'daily' ? 'bg-blue-50' : 'bg-violet-50'}`}>
                        {goal.goal_type === 'daily' ? (
                          <Check size={18} className="text-blue-600" weight="bold" />
                        ) : (
                          <Trophy size={18} className="text-violet-600" weight="bold" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{goal.title}</p>
                        <p className="text-xs text-muted-foreground capitalize">{goal.goal_type} goal</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {goal.target_value > 0 && (
                        <span className="text-sm text-muted-foreground">
                          {goal.current_value}/{goal.target_value}
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-red-500"
                        onClick={() => handleDeleteGoal(goal.id)}
                        data-testid={`delete-goal-${goal.id}`}
                      >
                        <Trash size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-[280px] items-center justify-center text-muted-foreground">
                <p>No goals yet. Set your first goal!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
