import { useState, useEffect } from "react";
import axios from "axios";
import { 
  Plus, 
  Trash, 
  Coins,
  Buildings,
  ChartLineUp,
  CurrencyCircleDollar,
  Scales
} from "@phosphor-icons/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
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
  AreaChart,
  Area
} from "recharts";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const INVESTMENT_TYPES = [
  { value: 'gold', label: 'Gold', icon: Coins, color: '#F59E0B' },
  { value: 'silver', label: 'Silver', icon: Scales, color: '#94A3B8' },
  { value: 'property', label: 'Property', icon: Buildings, color: '#10B981' },
  { value: 'stocks', label: 'Stocks', icon: ChartLineUp, color: '#3B82F6' },
  { value: 'crypto', label: 'Crypto', icon: CurrencyCircleDollar, color: '#8B5CF6' },
  { value: 'bonds', label: 'Bonds', icon: CurrencyCircleDollar, color: '#EC4899' },
  { value: 'mutual_funds', label: 'Mutual Funds', icon: ChartLineUp, color: '#06B6D4' },
  { value: 'other', label: 'Other', icon: CurrencyCircleDollar, color: '#64748B' }
];

const QUANTITY_UNITS = [
  { value: 'grams', label: 'Grams (g)' },
  { value: 'oz', label: 'Ounces (oz)' },
  { value: 'units', label: 'Units' },
  { value: 'sqft', label: 'Sq. Feet' },
  { value: 'shares', label: 'Shares' }
];

const TYPE_COLORS = {
  gold: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  silver: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
  property: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  stocks: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  crypto: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
  bonds: { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
  mutual_funds: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  other: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' }
};

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
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

export default function Investments() {
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [form, setForm] = useState({
    investment_type: 'gold',
    item_name: '',
    quantity: '',
    quantity_unit: 'grams',
    purchase_price: '',
    currency: 'USD',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    fetchInvestments();
  }, []);

  const fetchInvestments = async () => {
    try {
      const response = await axios.get(`${API}/investments`);
      setInvestments(response.data);
    } catch (error) {
      console.error("Failed to fetch investments:", error);
      toast.error("Failed to load investments");
    } finally {
      setLoading(false);
    }
  };

  const handleAddInvestment = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/investments`, {
        ...form,
        quantity: parseFloat(form.quantity),
        purchase_price: parseFloat(form.purchase_price)
      });
      toast.success("Investment added successfully");
      setDialogOpen(false);
      setForm({
        investment_type: 'gold',
        item_name: '',
        quantity: '',
        quantity_unit: 'grams',
        purchase_price: '',
        currency: 'USD',
        date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      fetchInvestments();
    } catch (error) {
      console.error("Failed to add investment:", error);
      toast.error("Failed to add investment");
    }
  };

  const handleDeleteInvestment = async (id) => {
    try {
      await axios.delete(`${API}/investments/${id}`);
      toast.success("Investment deleted");
      fetchInvestments();
    } catch (error) {
      toast.error("Failed to delete investment");
    }
  };

  // Calculate totals by type
  const totalsByType = investments.reduce((acc, inv) => {
    const type = inv.investment_type;
    acc[type] = (acc[type] || 0) + parseFloat(inv.purchase_price);
    return acc;
  }, {});

  const totalInvested = Object.values(totalsByType).reduce((sum, val) => sum + val, 0);

  // Pie chart data
  const pieData = Object.entries(totalsByType).map(([type, amount]) => ({
    name: type,
    value: amount,
    color: INVESTMENT_TYPES.find(t => t.value === type)?.color || '#64748B'
  }));

  // Investment over time
  const investmentsByMonth = investments.reduce((acc, inv) => {
    const month = inv.date.substring(0, 7);
    acc[month] = (acc[month] || 0) + parseFloat(inv.purchase_price);
    return acc;
  }, {});

  const sortedMonths = Object.keys(investmentsByMonth).sort();
  let cumulative = 0;
  const timelineData = sortedMonths.map(month => {
    cumulative += investmentsByMonth[month];
    return {
      month,
      invested: investmentsByMonth[month],
      total: cumulative
    };
  });

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center" data-testid="investments-loading">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading investments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="investments-page">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-heading text-4xl font-bold tracking-tight text-slate-900">
            Investments
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track your investment portfolio
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-blue-600 hover:bg-blue-700 btn-press" data-testid="add-investment-btn">
              <Plus size={18} weight="bold" />
              Add Investment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-heading">Add Investment</DialogTitle>
              <DialogDescription>Record a new investment entry</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddInvestment} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="investment-type">Type</Label>
                <Select 
                  value={form.investment_type} 
                  onValueChange={(value) => setForm({ ...form, investment_type: value })}
                >
                  <SelectTrigger data-testid="investment-type-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INVESTMENT_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon size={16} style={{ color: type.color }} />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-name">Item Name</Label>
                <Input
                  id="item-name"
                  placeholder="Gold Bar 24K, Apple Stock, etc."
                  value={form.item_name}
                  onChange={(e) => setForm({ ...form, item_name: e.target.value })}
                  required
                  data-testid="investment-name-input"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.01"
                    placeholder="100"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    required
                    data-testid="investment-quantity-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Select 
                    value={form.quantity_unit} 
                    onValueChange={(value) => setForm({ ...form, quantity_unit: value })}
                  >
                    <SelectTrigger data-testid="investment-unit-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {QUANTITY_UNITS.map(unit => (
                        <SelectItem key={unit.value} value={unit.value}>
                          {unit.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchase-price">Purchase Price ($)</Label>
                <Input
                  id="purchase-price"
                  type="number"
                  step="0.01"
                  placeholder="5000.00"
                  value={form.purchase_price}
                  onChange={(e) => setForm({ ...form, purchase_price: e.target.value })}
                  required
                  data-testid="investment-price-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="purchase-date">Purchase Date</Label>
                <Input
                  id="purchase-date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                  data-testid="investment-date-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Input
                  id="notes"
                  placeholder="Additional details..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  data-testid="investment-notes-input"
                />
              </div>
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" data-testid="submit-investment-btn">
                Add Investment
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Card */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700">Total Portfolio Value</p>
              <p className="mt-1 font-heading text-4xl font-bold text-blue-900 number-display">
                {formatCurrency(totalInvested)}
              </p>
              <p className="mt-1 text-sm text-blue-600">{investments.length} investments</p>
            </div>
            <div className="rounded-2xl bg-blue-100 p-4">
              <ChartLineUp size={36} weight="duotone" className="text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Portfolio Breakdown */}
        <Card className="chart-container" data-testid="portfolio-breakdown-chart">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-lg font-semibold text-slate-900">
              Portfolio Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <div>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
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
                <div className="mt-4 flex flex-wrap justify-center gap-3">
                  {pieData.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <div 
                        className="h-3 w-3 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="capitalize text-slate-600">{item.name.replace('_', ' ')}</span>
                      <span className="font-medium text-slate-900">{formatCurrency(item.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-[250px] items-center justify-center text-muted-foreground">
                <p>Add investments to see breakdown</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Investment Growth Over Time */}
        <Card className="chart-container" data-testid="investment-growth-chart">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-lg font-semibold text-slate-900">
              Investment Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            {timelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={timelineData}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
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
                  <Area 
                    type="monotone" 
                    dataKey="total" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    fill="url(#colorTotal)"
                    name="Total Invested"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[280px] items-center justify-center text-muted-foreground">
                <p>Add investments to track growth</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Investment List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-heading text-lg">All Investments</CardTitle>
        </CardHeader>
        <CardContent>
          {investments.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {investments.map((investment) => {
                const typeConfig = INVESTMENT_TYPES.find(t => t.value === investment.investment_type);
                const colors = TYPE_COLORS[investment.investment_type] || TYPE_COLORS.other;
                const Icon = typeConfig?.icon || CurrencyCircleDollar;
                
                return (
                  <Card 
                    key={investment.id} 
                    className={`${colors.bg} ${colors.border} border-2 transition-all hover:shadow-md`}
                    data-testid={`investment-item-${investment.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`rounded-xl p-2.5 ${colors.bg} border ${colors.border}`}>
                            <Icon size={24} weight="duotone" className={colors.text} />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{investment.item_name}</p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {investment.investment_type.replace('_', ' ')}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-red-600"
                          onClick={() => handleDeleteInvestment(investment.id)}
                          data-testid={`delete-investment-${investment.id}`}
                        >
                          <Trash size={16} />
                        </Button>
                      </div>
                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Quantity</span>
                          <span className="font-medium text-slate-900">
                            {investment.quantity} {investment.quantity_unit}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Purchase Price</span>
                          <span className="font-heading font-semibold text-slate-900 number-display">
                            {formatCurrency(parseFloat(investment.purchase_price))}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Date</span>
                          <span className="text-slate-600">{formatDate(investment.date)}</span>
                        </div>
                        {investment.notes && (
                          <p className="mt-2 text-xs text-muted-foreground italic">
                            {investment.notes}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="flex h-40 items-center justify-center text-muted-foreground">
              <p>No investments yet. Start building your portfolio!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
