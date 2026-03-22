import { useState, useEffect } from "react";
import axios from "axios";
import { 
  TrendUp, 
  TrendDown, 
  Wallet, 
  PiggyBank,
  ArrowsClockwise,
  ChartDonut,
  Sparkle
} from "@phosphor-icons/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  Bar,
  Line,
  Legend
} from "recharts";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CATEGORY_COLORS = {
  food: "#3B82F6",
  transport: "#6366F1",
  entertainment: "#8B5CF6",
  groceries: "#0EA5E9",
  health: "#EF4444",
  subscriptions: "#1D4ED8",
  utilities: "#4F46E5",
  shopping: "#7C3AED",
  other: "#64748B"
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="text-sm font-semibold text-foreground mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const StatCard = ({ title, value, icon: Icon, type }) => {
  const colors = {
    income: "text-primary",
    expense: "text-destructive",
    savings: "text-primary",
    investment: "text-primary"
  };
  
  return (
    <div className="stat-card animate-in" data-testid={`stat-${title.toLowerCase().replace(/\s/g, '-')}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            {title}
          </p>
          <p className={`font-heading text-2xl font-bold ${colors[type] || 'text-foreground'}`}>
            <span className="number-display">{formatCurrency(value)}</span>
          </p>
        </div>
        <div className="p-2.5 rounded-lg bg-secondary">
          <Icon size={22} weight="duotone" className="text-muted-foreground" />
        </div>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get(`${API}/dashboard/summary`);
      setSummary(response.data);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateDemoData = async () => {
    try {
      await axios.post(`${API}/generate-demo-data`);
      fetchDashboardData();
    } catch (error) {
      console.error("Failed to generate demo data:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center" data-testid="dashboard-loading">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const pieData = summary?.category_breakdown?.map(item => ({
    name: item.category,
    value: item.amount,
    color: CATEGORY_COLORS[item.category] || CATEGORY_COLORS.other
  })) || [];

  const totalExpensesByCategory = pieData.reduce((sum, item) => sum + item.value, 0);
  const hasData = summary?.expense_count > 0 || summary?.income_count > 0;

  // Enhanced chart data with cumulative savings
  const chartData = summary?.monthly_trend?.map((item, index, arr) => {
    const cumulativeSavings = arr.slice(0, index + 1).reduce((sum, i) => sum + i.savings, 0);
    return {
      ...item,
      cumulativeSavings
    };
  }) || [];

  return (
    <div className="space-y-6" data-testid="dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Your financial overview</p>
        </div>
        {!hasData && (
          <Button onClick={generateDemoData} className="gap-2" data-testid="generate-demo-btn">
            <Sparkle size={18} weight="fill" />
            Load Demo Data
          </Button>
        )}
      </div>

      {/* Total Wealth Banner - Clean, no gradient */}
      <div className="kpi-banner" data-testid="wealth-banner">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Total Wealth
        </p>
        <p className="dot-matrix dot-matrix-lg text-primary">
          {formatCurrency(summary?.total_wealth || 0)}
        </p>
        <div className="mt-6 flex gap-8 flex-wrap">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Net Savings</p>
            <p className="font-heading text-xl font-bold text-foreground number-display">
              {formatCurrency(summary?.net_savings || 0)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Investments</p>
            <p className="font-heading text-xl font-bold text-foreground number-display">
              {formatCurrency(summary?.total_investments || 0)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Savings Rate</p>
            <p className="font-heading text-xl font-bold text-primary number-display">
              {summary?.savings_rate?.toFixed(1) || 0}%
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Income" value={summary?.total_income || 0} icon={TrendUp} type="income" />
        <StatCard title="Total Expenses" value={summary?.total_expenses || 0} icon={TrendDown} type="expense" />
        <StatCard title="Net Savings" value={summary?.net_savings || 0} icon={PiggyBank} type="savings" />
        <StatCard title="Investments" value={summary?.total_investments || 0} icon={Wallet} type="investment" />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Combined Income/Expense/Savings Chart */}
        <Card className="lg:col-span-2 card-clean" data-testid="main-chart">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-base font-semibold">Financial Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => {
                      const [year, month] = value.split('-');
                      return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short' });
                    }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `$${value >= 1000 ? `${(value/1000).toFixed(0)}k` : value}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend 
                    wrapperStyle={{ paddingTop: '20px' }}
                    formatter={(value) => <span className="text-sm text-muted-foreground">{value}</span>}
                  />
                  <Bar dataKey="income" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Income" barSize={20} />
                  <Bar dataKey="expense" fill="#EF4444" radius={[4, 4, 0, 0]} name="Expenses" barSize={20} />
                  <Line 
                    type="monotone" 
                    dataKey="cumulativeSavings" 
                    stroke="#1D4ED8" 
                    strokeWidth={2}
                    dot={{ fill: '#1D4ED8', strokeWidth: 0, r: 4 }}
                    name="Cumulative Savings"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                <p>Add transactions to see chart</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Spending by Category */}
        <Card className="card-clean" data-testid="spending-category-chart">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 font-heading text-base font-semibold">
              <ChartDonut size={18} className="text-muted-foreground" />
              Spending by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <div className="relative">
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => formatCurrency(value)}
                      contentStyle={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '8px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="font-heading text-lg font-bold number-display">
                    {formatCurrency(totalExpensesByCategory)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex h-[220px] items-center justify-center text-muted-foreground">
                <p>No expense data</p>
              </div>
            )}
            {/* Legend */}
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
              {pieData.slice(0, 6).map((item, index) => (
                <div key={index} className="flex items-center gap-1.5 text-xs">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="capitalize text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second Row - Savings Chart & Subscriptions */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Savings Trend - Improved Area Chart */}
        <Card className="card-clean" data-testid="savings-chart">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 font-heading text-base font-semibold">
              <PiggyBank size={18} className="text-muted-foreground" />
              Savings Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => {
                      const [year, month] = value.split('-');
                      return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short' });
                    }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `$${value >= 1000 ? `${(value/1000).toFixed(0)}k` : value}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="savings" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    fill="url(#savingsGradient)"
                    dot={{ fill: '#3B82F6', strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6, stroke: '#3B82F6', strokeWidth: 2, fill: 'white' }}
                    name="Monthly Savings"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[220px] items-center justify-center text-muted-foreground">
                <p>Add transactions to track savings</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subscriptions - Clean */}
        <Card className="card-clean" data-testid="subscriptions-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 font-heading text-base font-semibold">
              <ArrowsClockwise size={18} className="text-muted-foreground" />
              Active Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {summary?.subscriptions?.length > 0 ? (
              <div className="space-y-2 max-h-[220px] overflow-y-auto">
                {summary.subscriptions.map((sub, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:border-primary/20 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-sm">{sub.description}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {sub.category} • {sub.recurring_period?.replace('_', ' ')}
                      </p>
                    </div>
                    <p className="font-semibold text-destructive number-display">
                      {formatCurrency(parseFloat(sub.amount))}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-[220px] items-center justify-center text-muted-foreground">
                <p>No recurring subscriptions</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
