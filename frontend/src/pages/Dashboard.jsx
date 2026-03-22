import { useState, useEffect } from "react";
import axios from "axios";
import { 
  TrendUp, 
  TrendDown, 
  Wallet, 
  PiggyBank,
  ArrowsClockwise,
  ChartDonut,
  Receipt,
  ChartLineUp
} from "@phosphor-icons/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from "recharts";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CATEGORY_COLORS = {
  food: "#F59E0B",
  transport: "#3B82F6",
  entertainment: "#EC4899",
  groceries: "#10B981",
  health: "#EF4444",
  subscriptions: "#8B5CF6",
  utilities: "#6366F1",
  shopping: "#F97316",
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
        <p className="text-sm font-medium text-slate-900">{label}</p>
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

const StatCard = ({ title, value, icon: Icon, trend, trendUp, color }) => (
  <Card className="stat-card animate-fade-in-up" data-testid={`stat-${title.toLowerCase().replace(/\s/g, '-')}`}>
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {title}
          </p>
          <p className={`mt-2 font-heading text-3xl font-bold tracking-tight ${color || 'text-slate-900'}`}>
            <span className="number-display">{formatCurrency(value)}</span>
          </p>
          {trend !== undefined && (
            <p className={`mt-1 text-xs font-medium ${trendUp ? 'text-income' : 'text-expense'}`}>
              {trendUp ? '+' : ''}{trend}% from last month
            </p>
          )}
        </div>
        <div className={`rounded-xl p-3 ${color === 'text-income' ? 'bg-emerald-50' : color === 'text-expense' ? 'bg-red-50' : 'bg-slate-100'}`}>
          <Icon size={24} weight="duotone" className={color || 'text-slate-600'} />
        </div>
      </div>
    </CardContent>
  </Card>
);

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

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center" data-testid="dashboard-loading">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading your finances...</p>
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

  return (
    <div className="space-y-6" data-testid="dashboard">
      {/* Header */}
      <div>
        <h1 className="font-heading text-4xl font-bold tracking-tight text-slate-900">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your financial overview at a glance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Income"
          value={summary?.total_income || 0}
          icon={TrendUp}
          color="text-income"
        />
        <StatCard
          title="Total Expenses"
          value={summary?.total_expenses || 0}
          icon={TrendDown}
          color="text-expense"
        />
        <StatCard
          title="Net Savings"
          value={summary?.net_savings || 0}
          icon={PiggyBank}
          color={summary?.net_savings >= 0 ? "text-income" : "text-expense"}
        />
        <StatCard
          title="Total Investments"
          value={summary?.total_investments || 0}
          icon={Wallet}
          color="text-investment"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Income vs Expenses Trend */}
        <Card className="lg:col-span-2 chart-container" data-testid="income-expense-chart">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-lg font-semibold text-slate-900">
              Income vs Expenses Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {summary?.monthly_trend?.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={summary.monthly_trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12, fill: '#64748B' }}
                    tickFormatter={(value) => {
                      const [year, month] = value.split('-');
                      return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short' });
                    }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#64748B' }}
                    tickFormatter={(value) => `$${value >= 1000 ? `${(value/1000).toFixed(0)}k` : value}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="income" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    dot={{ fill: '#10B981', strokeWidth: 2 }}
                    name="Income"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="expense" 
                    stroke="#EF4444" 
                    strokeWidth={2}
                    dot={{ fill: '#EF4444', strokeWidth: 2 }}
                    name="Expenses"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                <p>Add some transactions to see trends</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Spending by Category */}
        <Card className="chart-container" data-testid="spending-category-chart">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 font-heading text-lg font-semibold text-slate-900">
              <ChartDonut size={20} weight="duotone" />
              Spending by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <div className="relative">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => formatCurrency(value)}
                      contentStyle={{
                        background: 'white',
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="donut-center">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="font-heading text-lg font-bold text-slate-900 number-display">
                    {formatCurrency(totalExpensesByCategory)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex h-[250px] items-center justify-center text-muted-foreground">
                <p>No expense data yet</p>
              </div>
            )}
            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-2">
              {pieData.slice(0, 6).map((item, index) => (
                <div key={index} className="flex items-center gap-1.5 text-xs">
                  <div 
                    className="h-2.5 w-2.5 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="capitalize text-slate-600">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Savings Progression */}
        <Card className="chart-container" data-testid="savings-chart">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 font-heading text-lg font-semibold text-slate-900">
              <PiggyBank size={20} weight="duotone" />
              Savings Progression
            </CardTitle>
          </CardHeader>
          <CardContent>
            {summary?.monthly_trend?.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={summary.monthly_trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fontSize: 12, fill: '#64748B' }}
                    tickFormatter={(value) => {
                      const [year, month] = value.split('-');
                      return new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short' });
                    }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#64748B' }}
                    tickFormatter={(value) => `$${value >= 1000 ? `${(value/1000).toFixed(0)}k` : value}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar 
                    dataKey="savings" 
                    fill="#059669" 
                    radius={[4, 4, 0, 0]}
                    name="Savings"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[250px] items-center justify-center text-muted-foreground">
                <p>Add transactions to track savings</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subscriptions */}
        <Card className="chart-container" data-testid="subscriptions-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 font-heading text-lg font-semibold text-slate-900">
              <ArrowsClockwise size={20} weight="duotone" />
              Active Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {summary?.subscriptions?.length > 0 ? (
              <div className="space-y-3 max-h-[250px] overflow-y-auto">
                {summary.subscriptions.map((sub, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between rounded-lg bg-slate-50 p-3 transition-colors hover:bg-slate-100"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{sub.description}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {sub.category} • {sub.recurring_period?.replace('_', ' ')}
                      </p>
                    </div>
                    <p className="font-heading font-semibold text-expense number-display">
                      {formatCurrency(parseFloat(sub.amount))}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-[250px] items-center justify-center text-muted-foreground">
                <p>No recurring subscriptions</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-emerald-50 border-emerald-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-emerald-100 p-2">
                <TrendUp size={20} className="text-emerald-600" weight="bold" />
              </div>
              <div>
                <p className="text-xs text-emerald-700 font-medium">Savings Rate</p>
                <p className="font-heading text-2xl font-bold text-emerald-900 number-display">
                  {summary?.savings_rate?.toFixed(1) || 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-2">
                <Receipt size={20} className="text-blue-600" weight="bold" />
              </div>
              <div>
                <p className="text-xs text-blue-700 font-medium">Total Transactions</p>
                <p className="font-heading text-2xl font-bold text-blue-900 number-display">
                  {(summary?.expense_count || 0) + (summary?.income_count || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50 border-amber-100">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-amber-100 p-2">
                <ChartLineUp size={20} className="text-amber-600" weight="bold" />
              </div>
              <div>
                <p className="text-xs text-amber-700 font-medium">Investment Assets</p>
                <p className="font-heading text-2xl font-bold text-amber-900 number-display">
                  {summary?.investment_count || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
