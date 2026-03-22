import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { 
  Plus, 
  Trash,
  Coins,
  Buildings,
  ChartLineUp,
  CurrencyCircleDollar,
  CaretLeft,
  CaretRight,
  Calendar
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
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from "recharts";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const ITEMS_PER_PAGE = 12;

const INVESTMENT_TYPES = [
  { value: 'gold', label: 'Gold', icon: Coins },
  { value: 'silver', label: 'Silver', icon: Coins },
  { value: 'property', label: 'Property', icon: Buildings },
  { value: 'stocks', label: 'Stocks', icon: ChartLineUp },
  { value: 'crypto', label: 'Crypto', icon: CurrencyCircleDollar },
  { value: 'bonds', label: 'Bonds', icon: CurrencyCircleDollar },
  { value: 'mutual_funds', label: 'Mutual Funds', icon: ChartLineUp },
  { value: 'other', label: 'Other', icon: CurrencyCircleDollar }
];

const QUANTITY_UNITS = [
  { value: 'grams', label: 'Grams' },
  { value: 'oz', label: 'Ounces' },
  { value: 'units', label: 'Units' },
  { value: 'sqft', label: 'Sq. Feet' },
  { value: 'shares', label: 'Shares' }
];

const TYPE_COLORS = {
  gold: "#F59E0B",
  silver: "#64748B",
  property: "#10B981",
  stocks: "#3B82F6",
  crypto: "#8B5CF6",
  bonds: "#EC4899",
  mutual_funds: "#06B6D4",
  other: "#6B7280"
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

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-1 mt-4">
      <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="pagination-btn">
        <CaretLeft size={14} weight="bold" />
      </button>
      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
        let page = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
        if (page > totalPages) return null;
        return (
          <button key={page} onClick={() => onPageChange(page)} className={`pagination-btn ${currentPage === page ? 'active' : ''}`}>
            {page}
          </button>
        );
      })}
      <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="pagination-btn">
        <CaretRight size={14} weight="bold" />
      </button>
    </div>
  );
};

export default function Investments() {
  const [investments, setInvestments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

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
      toast.success("Investment added");
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
      toast.error("Failed to add investment");
    }
  };

  const handleDeleteInvestment = async (id) => {
    try {
      await axios.delete(`${API}/investments/${id}`);
      toast.success("Investment deleted");
      fetchInvestments();
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  // Totals by type (excluding property for chart to show other investments better)
  const totalsByType = useMemo(() => {
    return investments.reduce((acc, inv) => {
      const type = inv.investment_type;
      acc[type] = (acc[type] || 0) + parseFloat(inv.purchase_price);
      return acc;
    }, {});
  }, [investments]);

  const totalInvested = Object.values(totalsByType).reduce((sum, val) => sum + val, 0);

  // Bar chart data (better for showing disparity)
  const chartData = Object.entries(totalsByType)
    .map(([type, amount]) => ({
      name: type.replace('_', ' '),
      amount,
      color: TYPE_COLORS[type] || TYPE_COLORS.other
    }))
    .sort((a, b) => b.amount - a.amount);

  // Timeline data
  const timelineData = useMemo(() => {
    const byMonth = investments.reduce((acc, inv) => {
      const month = inv.date.substring(0, 7);
      acc[month] = (acc[month] || 0) + parseFloat(inv.purchase_price);
      return acc;
    }, {});
    
    let cumulative = 0;
    return Object.keys(byMonth).sort().map(month => {
      cumulative += byMonth[month];
      return { month, invested: byMonth[month], total: cumulative };
    });
  }, [investments]);

  // Filtered investments
  const filteredInvestments = useMemo(() => {
    let filtered = selectedCategory === 'all' 
      ? investments 
      : investments.filter(i => i.investment_type === selectedCategory);
    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [investments, selectedCategory]);

  const paginatedInvestments = filteredInvestments.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const totalPages = Math.ceil(filteredInvestments.length / ITEMS_PER_PAGE);

  const categories = ['all', ...Object.keys(totalsByType)];

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center" data-testid="investments-loading">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="investments-page">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Investments</h1>
          <p className="text-sm text-muted-foreground mt-1">Track your portfolio</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2" data-testid="add-investment-btn">
              <Plus size={16} weight="bold" />
              Add Investment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-heading">Add Investment</DialogTitle>
              <DialogDescription>Record a new investment</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddInvestment} className="space-y-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.investment_type} onValueChange={(v) => setForm({ ...form, investment_type: v })}>
                  <SelectTrigger data-testid="investment-type-select"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {INVESTMENT_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Item Name</Label>
                <Input placeholder="Gold Bar 24K, AAPL..." value={form.item_name} onChange={(e) => setForm({ ...form, item_name: e.target.value })} required data-testid="investment-name-input" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Quantity</Label>
                  <Input type="number" step="0.01" placeholder="100" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required data-testid="investment-quantity-input" />
                </div>
                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Select value={form.quantity_unit} onValueChange={(v) => setForm({ ...form, quantity_unit: v })}>
                    <SelectTrigger data-testid="investment-unit-select"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {QUANTITY_UNITS.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Purchase Price ($)</Label>
                <Input type="number" step="0.01" placeholder="5000" value={form.purchase_price} onChange={(e) => setForm({ ...form, purchase_price: e.target.value })} required data-testid="investment-price-input" />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required data-testid="investment-date-input" />
              </div>
              <Button type="submit" className="w-full" data-testid="submit-investment-btn">Add Investment</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Total Banner - Clean */}
      <div className="kpi-banner" data-testid="portfolio-banner">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Total Portfolio Value</p>
        <p className="dot-matrix dot-matrix-lg text-primary">{formatCurrency(totalInvested)}</p>
        <p className="text-sm text-muted-foreground mt-2">{investments.length} investments</p>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Portfolio Breakdown - Bar Chart */}
        <Card className="card-clean" data-testid="portfolio-breakdown-chart">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-base font-semibold">Portfolio Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={true} vertical={false} />
                  <XAxis type="number" tickFormatter={(v) => `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="amount" radius={[0, 4, 4, 0]} name="Value">
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[250px] items-center justify-center text-muted-foreground text-sm">
                <p>Add investments to see breakdown</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Growth Timeline */}
        <Card className="card-clean" data-testid="investment-growth-chart">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-base font-semibold">Investment Growth</CardTitle>
          </CardHeader>
          <CardContent>
            {timelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={timelineData}>
                  <defs>
                    <linearGradient id="investGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis dataKey="month" tickFormatter={(v) => { const [y, m] = v.split('-'); return new Date(y, m-1).toLocaleDateString('en-US', { month: 'short' }); }} tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                  <YAxis tickFormatter={(v) => `$${v >= 1000 ? `${(v/1000).toFixed(0)}k` : v}`} tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="total" stroke="#3B82F6" strokeWidth={2} fill="url(#investGradient)" dot={{ fill: '#3B82F6', strokeWidth: 0, r: 4 }} name="Total Invested" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-[250px] items-center justify-center text-muted-foreground text-sm">
                <p>Add investments to track growth</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* All Investments */}
      <Card className="card-clean">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="font-heading text-base font-semibold">All Investments</CardTitle>
            {/* Category Tabs */}
            <div className="flex gap-1 flex-wrap">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => { setSelectedCategory(cat); setCurrentPage(1); }}
                  className={`category-tab capitalize ${selectedCategory === cat ? 'active' : ''}`}
                >
                  {cat === 'all' ? 'All' : cat.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {paginatedInvestments.length > 0 ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {paginatedInvestments.map((inv) => {
                  const typeConfig = INVESTMENT_TYPES.find(t => t.value === inv.investment_type);
                  const Icon = typeConfig?.icon || CurrencyCircleDollar;
                  const color = TYPE_COLORS[inv.investment_type] || TYPE_COLORS.other;
                  
                  return (
                    <div key={inv.id} className="p-4 rounded-lg border border-border hover:border-primary/20 transition-colors" data-testid={`investment-item-${inv.id}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="p-2 rounded-lg bg-secondary">
                            <Icon size={18} style={{ color }} />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{inv.item_name}</p>
                            <p className="text-xs text-muted-foreground capitalize">{inv.investment_type.replace('_', ' ')}</p>
                          </div>
                        </div>
                        <button onClick={() => handleDeleteInvestment(inv.id)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" data-testid={`delete-investment-${inv.id}`}>
                          <Trash size={14} />
                        </button>
                      </div>
                      <div className="space-y-1.5 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Quantity</span>
                          <span className="font-medium">{inv.quantity} {inv.quantity_unit}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Value</span>
                          <span className="font-semibold text-primary number-display">{formatCurrency(parseFloat(inv.purchase_price))}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Date</span>
                          <span className="text-xs flex items-center gap-1"><Calendar size={12} />{formatDate(inv.date)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
            </>
          ) : (
            <div className="flex h-32 items-center justify-center text-muted-foreground text-sm">
              <p>No investments in this category</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
