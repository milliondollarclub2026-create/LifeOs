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
  CaretRight
} from "@phosphor-icons/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  
  return (
    <div className="flex items-center justify-center gap-1 mt-4">
      <button 
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="pagination-btn"
      >
        <CaretLeft size={14} weight="bold" />
      </button>
      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
        let page;
        if (totalPages <= 5) {
          page = i + 1;
        } else if (currentPage <= 3) {
          page = i + 1;
        } else if (currentPage >= totalPages - 2) {
          page = totalPages - 4 + i;
        } else {
          page = currentPage - 2 + i;
        }
        return (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`pagination-btn ${currentPage === page ? 'active' : ''}`}
          >
            {page}
          </button>
        );
      })}
      <button 
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="pagination-btn"
      >
        <CaretRight size={14} weight="bold" />
      </button>
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

  const [expenseForm, setExpenseForm] = useState({
    amount: '',
    category: 'food',
    description: '',
    date: new Date().toISOString().split('T')[0],
    tags: '',
    recurring_period: ''
  });

  const [incomeForm, setIncomeForm] = useState({
    amount: '',
    source: 'salary',
    description: '',
    date: new Date().toISOString().split('T')[0],
    recurring_period: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [expensesRes, incomeRes] = await Promise.all([
        axios.get(`${API}/expenses`),
        axios.get(`${API}/income`)
      ]);
      setExpenses(expensesRes.data);
      setIncome(incomeRes.data);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => 
      expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.category.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [expenses, searchQuery]);

  const filteredIncome = useMemo(() => {
    return income.filter(inc => 
      inc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inc.source.toLowerCase().includes(searchQuery.toLowerCase())
    ).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [income, searchQuery]);

  const paginatedExpenses = filteredExpenses.slice((expensePage - 1) * ITEMS_PER_PAGE, expensePage * ITEMS_PER_PAGE);
  const paginatedIncome = filteredIncome.slice((incomePage - 1) * ITEMS_PER_PAGE, incomePage * ITEMS_PER_PAGE);
  
  const expenseTotalPages = Math.ceil(filteredExpenses.length / ITEMS_PER_PAGE);
  const incomeTotalPages = Math.ceil(filteredIncome.length / ITEMS_PER_PAGE);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/expenses`, {
        ...expenseForm,
        amount: parseFloat(expenseForm.amount)
      });
      toast.success("Expense added");
      setExpenseDialogOpen(false);
      setExpenseForm({
        amount: '',
        category: 'food',
        description: '',
        date: new Date().toISOString().split('T')[0],
        tags: '',
        recurring_period: ''
      });
      fetchData();
    } catch (error) {
      toast.error("Failed to add expense");
    }
  };

  const handleAddIncome = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/income`, {
        ...incomeForm,
        amount: parseFloat(incomeForm.amount)
      });
      toast.success("Income added");
      setIncomeDialogOpen(false);
      setIncomeForm({
        amount: '',
        source: 'salary',
        description: '',
        date: new Date().toISOString().split('T')[0],
        recurring_period: ''
      });
      fetchData();
    } catch (error) {
      toast.error("Failed to add income");
    }
  };

  const handleDeleteExpense = async (id) => {
    try {
      await axios.delete(`${API}/expenses/${id}`);
      toast.success("Expense deleted");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  const handleDeleteIncome = async (id) => {
    try {
      await axios.delete(`${API}/income/${id}`);
      toast.success("Income deleted");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
  const totalIncome = income.reduce((sum, i) => sum + parseFloat(i.amount), 0);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center" data-testid="transactions-loading">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
        </div>
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
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-heading">Add Income</DialogTitle>
                <DialogDescription>Record a new income entry</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddIncome} className="space-y-4">
                <div className="space-y-2">
                  <Label>Amount ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={incomeForm.amount}
                    onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })}
                    required
                    data-testid="income-amount-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Source</Label>
                  <Select value={incomeForm.source} onValueChange={(v) => setIncomeForm({ ...incomeForm, source: v })}>
                    <SelectTrigger data-testid="income-source-select"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {INCOME_SOURCES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    placeholder="Monthly salary..."
                    value={incomeForm.description}
                    onChange={(e) => setIncomeForm({ ...incomeForm, description: e.target.value })}
                    required
                    data-testid="income-description-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={incomeForm.date}
                    onChange={(e) => setIncomeForm({ ...incomeForm, date: e.target.value })}
                    required
                    data-testid="income-date-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Recurring</Label>
                  <Select value={incomeForm.recurring_period} onValueChange={(v) => setIncomeForm({ ...incomeForm, recurring_period: v })}>
                    <SelectTrigger><SelectValue placeholder="One-time" /></SelectTrigger>
                    <SelectContent>
                      {RECURRING_OPTIONS.map(o => <SelectItem key={o.value || 'onetime'} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" data-testid="submit-income-btn">Add Income</Button>
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
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-heading">Add Expense</DialogTitle>
                <DialogDescription>Record a new expense</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddExpense} className="space-y-4">
                <div className="space-y-2">
                  <Label>Amount ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    required
                    data-testid="expense-amount-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={expenseForm.category} onValueChange={(v) => setExpenseForm({ ...expenseForm, category: v })}>
                    <SelectTrigger data-testid="expense-category-select"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    placeholder="Lunch, groceries..."
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                    required
                    data-testid="expense-description-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                    required
                    data-testid="expense-date-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Recurring</Label>
                  <Select value={expenseForm.recurring_period} onValueChange={(v) => setExpenseForm({ ...expenseForm, recurring_period: v })}>
                    <SelectTrigger><SelectValue placeholder="One-time" /></SelectTrigger>
                    <SelectContent>
                      {RECURRING_OPTIONS.map(o => <SelectItem key={o.value || 'onetime'} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" data-testid="submit-expense-btn">Add Expense</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards - Clean */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Income</p>
              <p className="mt-1 font-heading text-3xl font-bold text-primary number-display">
                {formatCurrency(totalIncome)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{income.length} entries</p>
            </div>
            <div className="p-3 rounded-lg bg-secondary">
              <TrendUp size={24} weight="duotone" className="text-primary" />
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total Expenses</p>
              <p className="mt-1 font-heading text-3xl font-bold text-destructive number-display">
                {formatCurrency(totalExpenses)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{expenses.length} entries</p>
            </div>
            <div className="p-3 rounded-lg bg-secondary">
              <TrendDown size={24} weight="duotone" className="text-destructive" />
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search transactions..."
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setExpensePage(1); setIncomePage(1); }}
          className="pl-10"
          data-testid="search-input"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="expenses" className="space-y-4">
        <TabsList className="grid w-full max-w-xs grid-cols-2">
          <TabsTrigger value="expenses" data-testid="expenses-tab">Expenses</TabsTrigger>
          <TabsTrigger value="income" data-testid="income-tab">Income</TabsTrigger>
        </TabsList>

        {/* Expenses Tab */}
        <TabsContent value="expenses">
          <Card className="card-clean">
            <CardHeader className="pb-3">
              <CardTitle className="font-heading text-base font-semibold">
                All Expenses ({filteredExpenses.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {paginatedExpenses.length > 0 ? (
                <>
                  <div className="space-y-1">
                    {paginatedExpenses.map((expense) => (
                      <div key={expense.id} className="table-row flex items-center justify-between p-3" data-testid={`expense-item-${expense.id}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-1 h-8 rounded-full bg-destructive" />
                          <div>
                            <p className="font-medium text-sm">{expense.description}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-muted-foreground capitalize">{expense.category}</span>
                              <span className="text-xs text-muted-foreground">•</span>
                              <span className="text-xs text-muted-foreground">{formatDate(expense.date)}</span>
                              {expense.recurring_period && (
                                <>
                                  <span className="text-xs text-muted-foreground">•</span>
                                  <span className="text-xs text-primary flex items-center gap-1">
                                    <ArrowsClockwise size={10} />
                                    {expense.recurring_period.replace('_', ' ')}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="font-semibold text-destructive number-display">
                            -{formatCurrency(parseFloat(expense.amount))}
                          </p>
                          <button
                            onClick={() => handleDeleteExpense(expense.id)}
                            className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                            data-testid={`delete-expense-${expense.id}`}
                          >
                            <Trash size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Pagination currentPage={expensePage} totalPages={expenseTotalPages} onPageChange={setExpensePage} />
                </>
              ) : (
                <div className="flex h-32 items-center justify-center text-muted-foreground text-sm">
                  <p>No expenses found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Income Tab */}
        <TabsContent value="income">
          <Card className="card-clean">
            <CardHeader className="pb-3">
              <CardTitle className="font-heading text-base font-semibold">
                All Income ({filteredIncome.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {paginatedIncome.length > 0 ? (
                <>
                  <div className="space-y-1">
                    {paginatedIncome.map((inc) => (
                      <div key={inc.id} className="table-row flex items-center justify-between p-3" data-testid={`income-item-${inc.id}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-1 h-8 rounded-full bg-primary" />
                          <div>
                            <p className="font-medium text-sm">{inc.description}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-muted-foreground capitalize">{inc.source}</span>
                              <span className="text-xs text-muted-foreground">•</span>
                              <span className="text-xs text-muted-foreground">{formatDate(inc.date)}</span>
                              {inc.recurring_period && (
                                <>
                                  <span className="text-xs text-muted-foreground">•</span>
                                  <span className="text-xs text-primary flex items-center gap-1">
                                    <ArrowsClockwise size={10} />
                                    {inc.recurring_period.replace('_', ' ')}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <p className="font-semibold text-primary number-display">
                            +{formatCurrency(parseFloat(inc.amount))}
                          </p>
                          <button
                            onClick={() => handleDeleteIncome(inc.id)}
                            className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                            data-testid={`delete-income-${inc.id}`}
                          >
                            <Trash size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Pagination currentPage={incomePage} totalPages={incomeTotalPages} onPageChange={setIncomePage} />
                </>
              ) : (
                <div className="flex h-32 items-center justify-center text-muted-foreground text-sm">
                  <p>No income found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
