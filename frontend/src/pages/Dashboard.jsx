import { useState, useEffect } from "react";
import axios from "axios";
import { 
  TrendUp, 
  TrendDown, 
  Wallet, 
  PiggyBank,
  ArrowsClockwise,
  ChartDonut,
  CurrencyDollar,
  Sparkle
} from "@phosphor-icons/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

const StatCard = ({ title, value, icon: Icon, color, iconBg }) => (
  <Card className="stat-card animate-fade-in-up" data-testid={`stat-${title.toLowerCase().replace(/\s/g, '-')}`}>
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          <p className={`mt-2 font-heading text-3xl font-bold tracking-tight ${color || 'text-foreground'}`}>
            <span className="matrix-number">{formatCurrency(value)}</span>
          </p>
        </div>
        <div className={`icon-container p-3 ${iconBg || 'bg-slate-100'}`}>
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
  const hasData = summary?.expense_count > 0 || summary?.income_count > 0;

  return (
    <div className="space-y-6" data-testid="dashboard">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your financial overview at a glance
          </p>
        </div>
        {!hasData && (
          <Button onClick={generateDemoData} className="gap-2 btn-press" data-testid="generate-demo-btn">
            <Sparkle size={18} weight="fill" />
            Load Demo Data
          </Button>
        )}
      </div>

      {/* Wealth Banner */}
      <div className="wealth-banner" data-testid="wealth-banner">
        <div className="relative z-10">
          <p className="text-sm font-medium text-white/80 uppercase tracking-wider">Total Wealth</p>
          <p className="mt-2 font-heading text-5xl font-bold tracking-tight matrix-number">
            {formatCurrency(summary?.total_wealth || 0)}
          </p>
          <div className="mt-4 flex gap-8">
            <div>
              <p className="text-xs text-white/60">Net Savings</p>
              <p className="text-lg font-semibold">{formatCurrency(summary?.net_savings || 0)}</p>
            </div>
            <div>
              <p className="text-xs text-white/60">Investments</p>
              <p className="text-lg font-semibold">{formatCurrency(summary?.total_investments || 0)}</p>
            </div>
            <div>
              <p className="text-xs text-white/60">Savings Rate</p>
              <p className="text-lg font-semibold">{summary?.savings_rate?.toFixed(1) || 0}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Income"
          value={summary?.total_income || 0}
          icon={TrendUp}
          color="text-blue-600"
          iconBg="bg-blue-50"
        />
        <StatCard
          title="Total Expenses"
          value={summary?.total_expenses || 0}
          icon={TrendDown}
          color="text-red-500"
          iconBg="bg-red-50"
        />
        <StatCard
          title="Net Savings"
          value={summary?.net_savings || 0}
          icon={PiggyBank}
          color={summary?.net_savings >= 0 ? "text-blue-600" : "text-red-500"}
          iconBg={summary?.net_savings >= 0 ? "bg-blue-50" : "bg-red-50"}
        />
        <StatCard
          title="Investments"
          value={summary?.total_investments || 0}
          icon={Wallet}
          color="text-violet-600"
          iconBg="bg-violet-50"
        />
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Income vs Expenses Trend */}
        <Card className="lg:col-span-2 card-hover" data-testid="income-expense-chart">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-lg font-semibold">
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
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                    name="Income"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="expense" 
                    stroke="#EF4444" 
                    strokeWidth={2}
                    dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
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
        <Card className="card-hover" data-testid="spending-category-chart">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 font-heading text-lg font-semibold">
              <ChartDonut size={20} weight="duotone" className="text-muted-foreground" />
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
                <div className="donut-center absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="font-heading text-lg font-bold matrix-number">
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
                  <span className="capitalize text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Savings Progression */}
        <Card className="card-hover" data-testid="savings-chart">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 font-heading text-lg font-semibold">
              <PiggyBank size={20} weight="duotone" className="text-muted-foreground" />
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
                    fill="#3B82F6" 
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
        <Card className="card-hover" data-testid="subscriptions-card">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 font-heading text-lg font-semibold">
              <ArrowsClockwise size={20} weight="duotone" className="text-muted-foreground" />
              Active Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {summary?.subscriptions?.length > 0 ? (
              <div className="space-y-3 max-h-[250px] overflow-y-auto">
                {summary.subscriptions.map((sub, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between rounded-lg bg-secondary/50 p-3 transition-all hover:bg-secondary"
                  >
                    <div>
                      <p className="font-medium">{sub.description}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {sub.category} • {sub.recurring_period?.replace('_', ' ')}
                      </p>
                    </div>
                    <p className="font-heading font-semibold text-red-500 matrix-number">
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
    </div>
  );
}
