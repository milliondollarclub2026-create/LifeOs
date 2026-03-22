import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { 
  Plus, 
  Trash, 
  TrendUp, 
  TrendDown,
  ArrowsClockwise,
  MagnifyingGlass,
  CaretLeft,
  CaretRight,
  CaretUp,
  CaretDown,
  NotePencil
} from "@phosphor-icons/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
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

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const ITEMS_PER_PAGE = 25;

const EXPENSE_CATEGORIES = [
  { value: 'food', label: 'Food' },
  { value: 'transport', label: 'Transport' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'groceries', label: 'Groceries' },
  { value: 'health', label: 'Health' },
  { value: 'subscriptions', label: 'Subscriptions' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'other', label: 'Other' }
];

const INCOME_SOURCES = [
  { value: 'salary', label: 'Salary' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'investments', label: 'Investments' },
  { value: 'rental', label: 'Rental' },
  { value: 'business', label: 'Business' },
  { value: 'other', label: 'Other' }
];

const RECURRING_OPTIONS = [
  { value: '', label: 'One-time' },
  { value: '1_month', label: 'Monthly' },
  { value: '6_months', label: 'Every 6 Months' },
  { value: '12_months', label: 'Yearly' }
];

const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

const Pagination = ({ currentPage, totalPages, onPageChange, totalItems }) => {
  if (totalPages <= 1) return null;
  const start = (currentPage - 1) * ITEMS_PER_PAGE + 1;
  const end = Math.min(currentPage * ITEMS_PER_PAGE, totalItems);
  
  return (
    <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
      <p className="text-xs text-muted-foreground">
        Showing {start}-{end} of {totalItems}
      </p>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="pagination-btn">
          <CaretLeft size={14} weight="bold" />
        </button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let page;
          if (totalPages <= 5) page = i + 1;
          else if (currentPage <= 3) page = i + 1;
          else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
          else page = currentPage - 2 + i;
          if (page < 1 || page > totalPages) return null;
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
    </div>
  );
};

export default function Transactions() {
  const [expenses, setExpenses] = useState([]);
  const [income, setIncome] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [incomeDialogOpen, setIncomeDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expensePage, setExpensePage] = useState(1);
  const [incomePage, setIncomePage] = useState(1);
  const [sortField, setSortField] = useState('date');
  const [sortDir, setSortDir] = useState('desc');

  const [expenseForm, setExpenseForm] = useState({
    amount: '', category: 'food', description: '', date: new Date().toISOString().split('T')[0], tags: '', notes: '', recurring_period: ''
  });

  const [incomeForm, setIncomeForm] = useState({
    amount: '', source: 'salary', description: '', date: new Date().toISOString().split('T')[0], notes: '', recurring_period: ''
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [expensesRes, incomeRes] = await Promise.all([
        axios.get(`${API}/expenses`),
        axios.get(`${API}/income`)
      ]);
      setExpenses(expensesRes.data);
      setIncome(incomeRes.data);
    } catch (error) {
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  // Calculate running balance for expenses
  const processedExpenses = useMemo(() => {
    const filtered = expenses
      .filter(e => e.description.toLowerCase().includes(searchQuery.toLowerCase()) || e.category.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => {
        if (sortField === 'date') return sortDir === 'desc' ? new Date(b.date) - new Date(a.date) : new Date(a.date) - new Date(b.date);
        if (sortField === 'amount') return sortDir === 'desc' ? parseFloat(b.amount) - parseFloat(a.amount) : parseFloat(a.amount) - parseFloat(b.amount);
        return 0;
      });
    
    // Calculate running total (for display purposes)
    const totalIncome = income.reduce((sum, i) => sum + parseFloat(i.amount), 0);
    let runningBalance = totalIncome;
    
    // Sort by date ascending for balance calculation
    const sortedByDate = [...expenses].sort((a, b) => new Date(a.date) - new Date(b.date));
    const balanceMap = {};
    sortedByDate.forEach(exp => {
      runningBalance -= parseFloat(exp.amount);
      balanceMap[exp.id] = runningBalance;
    });
    
    return filtered.map(exp => ({
      ...exp,
      balance: balanceMap[exp.id] || 0
    }));
  }, [expenses, income, searchQuery, sortField, sortDir]);

  const processedIncome = useMemo(() => {
    const filtered = income
      .filter(i => i.description.toLowerCase().includes(searchQuery.toLowerCase()) || i.source.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => {
        if (sortField === 'date') return sortDir === 'desc' ? new Date(b.date) - new Date(a.date) : new Date(a.date) - new Date(b.date);
        if (sortField === 'amount') return sortDir === 'desc' ? parseFloat(b.amount) - parseFloat(a.amount) : parseFloat(a.amount) - parseFloat(b.amount);
        return 0;
      });
    
    // Running balance for income
    let runningTotal = 0;
    const sortedByDate = [...income].sort((a, b) => new Date(a.date) - new Date(b.date));
    const balanceMap = {};
    sortedByDate.forEach(inc => {
      runningTotal += parseFloat(inc.amount);
      balanceMap[inc.id] = runningTotal;
    });
    
    return filtered.map(inc => ({
      ...inc,
      balance: balanceMap[inc.id] || 0
    }));
  }, [income, searchQuery, sortField, sortDir]);

  const paginatedExpenses = processedExpenses.slice((expensePage - 1) * ITEMS_PER_PAGE, expensePage * ITEMS_PER_PAGE);
  const paginatedIncome = processedIncome.slice((incomePage - 1) * ITEMS_PER_PAGE, incomePage * ITEMS_PER_PAGE);
  const expenseTotalPages = Math.ceil(processedExpenses.length / ITEMS_PER_PAGE);
  const incomeTotalPages = Math.ceil(processedIncome.length / ITEMS_PER_PAGE);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortDir === 'desc' ? <CaretDown size={12} weight="bold" /> : <CaretUp size={12} weight="bold" />;
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/expenses`, { ...expenseForm, amount: parseFloat(expenseForm.amount) });
      toast.success("Expense added");
      setExpenseDialogOpen(false);
      setExpenseForm({ amount: '', category: 'food', description: '', date: new Date().toISOString().split('T')[0], tags: '', notes: '', recurring_period: '' });
      fetchData();
    } catch (error) { toast.error("Failed to add expense"); }
  };

  const handleAddIncome = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/income`, { ...incomeForm, amount: parseFloat(incomeForm.amount) });
      toast.success("Income added");
      setIncomeDialogOpen(false);
      setIncomeForm({ amount: '', source: 'salary', description: '', date: new Date().toISOString().split('T')[0], notes: '', recurring_period: '' });
      fetchData();
    } catch (error) { toast.error("Failed to add income"); }
  };

  const handleDeleteExpense = async (id) => {
    try { await axios.delete(`${API}/expenses/${id}`); toast.success("Deleted"); fetchData(); } catch { toast.error("Failed"); }
  };

  const handleDeleteIncome = async (id) => {
    try { await axios.delete(`${API}/income/${id}`); toast.success("Deleted"); fetchData(); } catch { toast.error("Failed"); }
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
  const totalIncome = income.reduce((sum, i) => sum + parseFloat(i.amount), 0);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center" data-testid="transactions-loading">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="transactions-page">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Transactions</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage income and expenses</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={incomeDialogOpen} onOpenChange={setIncomeDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" data-testid="add-income-btn">
                <TrendUp size={16} weight="bold" />
                Add Income
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="font-heading">Add Income</DialogTitle>
                <DialogDescription>Record a new income entry</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddIncome} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Amount ($)</Label>
                    <Input type="number" step="0.01" placeholder="0.00" value={incomeForm.amount} onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Source</Label>
                    <Select value={incomeForm.source} onValueChange={(v) => setIncomeForm({ ...incomeForm, source: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{INCOME_SOURCES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input placeholder="Monthly salary..." value={incomeForm.description} onChange={(e) => setIncomeForm({ ...incomeForm, description: e.target.value })} required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input type="date" value={incomeForm.date} onChange={(e) => setIncomeForm({ ...incomeForm, date: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Recurring</Label>
                    <Select value={incomeForm.recurring_period} onValueChange={(v) => setIncomeForm({ ...incomeForm, recurring_period: v })}>
                      <SelectTrigger><SelectValue placeholder="One-time" /></SelectTrigger>
                      <SelectContent>{RECURRING_OPTIONS.map(o => <SelectItem key={o.value || 'onetime'} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes (optional)</Label>
                  <Textarea placeholder="Additional notes..." value={incomeForm.notes} onChange={(e) => setIncomeForm({ ...incomeForm, notes: e.target.value })} rows={2} />
                </div>
                <Button type="submit" className="w-full">Add Income</Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2" data-testid="add-expense-btn">
                <TrendDown size={16} weight="bold" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="font-heading">Add Expense</DialogTitle>
                <DialogDescription>Record a new expense</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddExpense} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Amount ($)</Label>
                    <Input type="number" step="0.01" placeholder="0.00" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={expenseForm.category} onValueChange={(v) => setExpenseForm({ ...expenseForm, category: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{EXPENSE_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input placeholder="Lunch, groceries..." value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input type="date" value={expenseForm.date} onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Recurring</Label>
                    <Select value={expenseForm.recurring_period} onValueChange={(v) => setExpenseForm({ ...expenseForm, recurring_period: v })}>
                      <SelectTrigger><SelectValue placeholder="One-time" /></SelectTrigger>
                      <SelectContent>{RECURRING_OPTIONS.map(o => <SelectItem key={o.value || 'onetime'} value={o.value}>{o.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Notes (optional)</Label>
                  <Textarea placeholder="Additional notes..." value={expenseForm.notes} onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })} rows={2} />
                </div>
                <Button type="submit" className="w-full">Add Expense</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Income</p>
              <p className="mt-1 font-heading text-3xl font-bold text-primary number-display">{formatCurrency(totalIncome)}</p>
              <p className="text-xs text-muted-foreground mt-1">{income.length} entries</p>
            </div>
            <div className="p-3 rounded-lg bg-secondary"><TrendUp size={24} weight="duotone" className="text-primary" /></div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Expenses</p>
              <p className="mt-1 font-heading text-3xl font-bold text-destructive number-display">{formatCurrency(totalExpenses)}</p>
              <p className="text-xs text-muted-foreground mt-1">{expenses.length} entries</p>
            </div>
            <div className="p-3 rounded-lg bg-secondary"><TrendDown size={24} weight="duotone" className="text-destructive" /></div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search transactions..." value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setExpensePage(1); setIncomePage(1); }} className="pl-10" data-testid="search-input" />
      </div>

      {/* Tabs with Excel-like Tables */}
      <Tabs defaultValue="expenses" className="space-y-4">
        <TabsList className="grid w-full max-w-xs grid-cols-2">
          <TabsTrigger value="expenses" data-testid="expenses-tab">Expenses ({processedExpenses.length})</TabsTrigger>
          <TabsTrigger value="income" data-testid="income-tab">Income ({processedIncome.length})</TabsTrigger>
        </TabsList>

        {/* Expenses Table */}
        <TabsContent value="expenses">
          <Card className="card-clean overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-secondary/50">
                      <th className="text-left p-3 font-semibold text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => handleSort('date')}>
                        <div className="flex items-center gap-1">Date <SortIcon field="date" /></div>
                      </th>
                      <th className="text-left p-3 font-semibold text-muted-foreground">Description</th>
                      <th className="text-left p-3 font-semibold text-muted-foreground">Category</th>
                      <th className="text-right p-3 font-semibold text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => handleSort('amount')}>
                        <div className="flex items-center justify-end gap-1">Amount <SortIcon field="amount" /></div>
                      </th>
                      <th className="text-right p-3 font-semibold text-muted-foreground">Balance</th>
                      <th className="text-left p-3 font-semibold text-muted-foreground">Notes</th>
                      <th className="text-center p-3 font-semibold text-muted-foreground w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedExpenses.length > 0 ? paginatedExpenses.map((exp) => (
                      <tr key={exp.id} className="border-b border-border hover:bg-secondary/30 transition-colors" data-testid={`expense-item-${exp.id}`}>
                        <td className="p-3 text-muted-foreground whitespace-nowrap">{formatDate(exp.date)}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{exp.description}</span>
                            {exp.recurring_period && (
                              <span className="inline-flex items-center gap-0.5 text-xs text-primary">
                                <ArrowsClockwise size={10} />
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-secondary capitalize">{exp.category}</span>
                        </td>
                        <td className="p-3 text-right font-semibold text-destructive number-display whitespace-nowrap">-{formatCurrency(parseFloat(exp.amount))}</td>
                        <td className="p-3 text-right text-muted-foreground number-display whitespace-nowrap">{formatCurrency(exp.balance)}</td>
                        <td className="p-3 max-w-[150px]">
                          {exp.notes ? (
                            <span className="text-xs text-muted-foreground truncate block" title={exp.notes}>{exp.notes}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground/50">-</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <button onClick={() => handleDeleteExpense(exp.id)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                            <Trash size={14} />
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No expenses found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="px-3 pb-3">
                <Pagination currentPage={expensePage} totalPages={expenseTotalPages} onPageChange={setExpensePage} totalItems={processedExpenses.length} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Income Table */}
        <TabsContent value="income">
          <Card className="card-clean overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-secondary/50">
                      <th className="text-left p-3 font-semibold text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => handleSort('date')}>
                        <div className="flex items-center gap-1">Date <SortIcon field="date" /></div>
                      </th>
                      <th className="text-left p-3 font-semibold text-muted-foreground">Description</th>
                      <th className="text-left p-3 font-semibold text-muted-foreground">Source</th>
                      <th className="text-right p-3 font-semibold text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => handleSort('amount')}>
                        <div className="flex items-center justify-end gap-1">Amount <SortIcon field="amount" /></div>
                      </th>
                      <th className="text-right p-3 font-semibold text-muted-foreground">Total</th>
                      <th className="text-left p-3 font-semibold text-muted-foreground">Notes</th>
                      <th className="text-center p-3 font-semibold text-muted-foreground w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedIncome.length > 0 ? paginatedIncome.map((inc) => (
                      <tr key={inc.id} className="border-b border-border hover:bg-secondary/30 transition-colors" data-testid={`income-item-${inc.id}`}>
                        <td className="p-3 text-muted-foreground whitespace-nowrap">{formatDate(inc.date)}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{inc.description}</span>
                            {inc.recurring_period && (
                              <span className="inline-flex items-center gap-0.5 text-xs text-primary">
                                <ArrowsClockwise size={10} />
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-secondary capitalize">{inc.source}</span>
                        </td>
                        <td className="p-3 text-right font-semibold text-primary number-display whitespace-nowrap">+{formatCurrency(parseFloat(inc.amount))}</td>
                        <td className="p-3 text-right text-muted-foreground number-display whitespace-nowrap">{formatCurrency(inc.balance)}</td>
                        <td className="p-3 max-w-[150px]">
                          {inc.notes ? (
                            <span className="text-xs text-muted-foreground truncate block" title={inc.notes}>{inc.notes}</span>
                          ) : (
                            <span className="text-xs text-muted-foreground/50">-</span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <button onClick={() => handleDeleteIncome(inc.id)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                            <Trash size={14} />
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No income found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="px-3 pb-3">
                <Pagination currentPage={incomePage} totalPages={incomeTotalPages} onPageChange={setIncomePage} totalItems={processedIncome.length} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
