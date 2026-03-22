import { useState, useEffect } from "react";
import axios from "axios";
import { 
  Plus, 
  Trash, 
  TrendUp, 
  TrendDown,
  ArrowsClockwise,
  MagnifyingGlass,
  Funnel
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
  { value: 'onetime', label: 'One-time' },
  { value: '1_month', label: 'Monthly' },
  { value: '6_months', label: 'Every 6 Months' },
  { value: '12_months', label: 'Yearly' }
];

const CATEGORY_COLORS = {
  food: "bg-amber-100 text-amber-700",
  transport: "bg-blue-100 text-blue-700",
  entertainment: "bg-pink-100 text-pink-700",
  groceries: "bg-emerald-100 text-emerald-700",
  health: "bg-red-100 text-red-700",
  subscriptions: "bg-violet-100 text-violet-700",
  utilities: "bg-indigo-100 text-indigo-700",
  shopping: "bg-orange-100 text-orange-700",
  other: "bg-slate-100 text-slate-700",
  salary: "bg-emerald-100 text-emerald-700",
  freelance: "bg-blue-100 text-blue-700",
  investments: "bg-amber-100 text-amber-700",
  rental: "bg-violet-100 text-violet-700",
  business: "bg-teal-100 text-teal-700"
};

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

export default function Transactions() {
  const [expenses, setExpenses] = useState([]);
  const [income, setIncome] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [incomeDialogOpen, setIncomeDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");

  // Expense form state
  const [expenseForm, setExpenseForm] = useState({
    amount: '',
    category: 'food',
    description: '',
    date: new Date().toISOString().split('T')[0],
    tags: '',
    recurring_period: 'onetime'
  });

  // Income form state
  const [incomeForm, setIncomeForm] = useState({
    amount: '',
    source: 'salary',
    description: '',
    date: new Date().toISOString().split('T')[0],
    recurring_period: 'onetime'
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

  const handleAddExpense = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/expenses`, {
        ...expenseForm,
        amount: parseFloat(expenseForm.amount),
        recurring_period: expenseForm.recurring_period === 'onetime' ? '' : expenseForm.recurring_period
      });
      toast.success("Expense added successfully");
      setExpenseDialogOpen(false);
      setExpenseForm({
        amount: '',
        category: 'food',
        description: '',
        date: new Date().toISOString().split('T')[0],
        tags: '',
        recurring_period: 'onetime'
      });
      fetchData();
    } catch (error) {
      console.error("Failed to add expense:", error);
      toast.error("Failed to add expense");
    }
  };

  const handleAddIncome = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/income`, {
        ...incomeForm,
        amount: parseFloat(incomeForm.amount),
        recurring_period: incomeForm.recurring_period === 'onetime' ? '' : incomeForm.recurring_period
      });
      toast.success("Income added successfully");
      setIncomeDialogOpen(false);
      setIncomeForm({
        amount: '',
        source: 'salary',
        description: '',
        date: new Date().toISOString().split('T')[0],
        recurring_period: 'onetime'
      });
      fetchData();
    } catch (error) {
      console.error("Failed to add income:", error);
      toast.error("Failed to add income");
    }
  };

  const handleDeleteExpense = async (id) => {
    try {
      await axios.delete(`${API}/expenses/${id}`);
      toast.success("Expense deleted");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete expense");
    }
  };

  const handleDeleteIncome = async (id) => {
    try {
      await axios.delete(`${API}/income/${id}`);
      toast.success("Income deleted");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete income");
    }
  };

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         expense.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterCategory === "all" || expense.category === filterCategory;
    return matchesSearch && matchesFilter;
  });

  const filteredIncome = income.filter(inc => {
    const matchesSearch = inc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         inc.source.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const totalExpenses = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
  const totalIncome = income.reduce((sum, i) => sum + parseFloat(i.amount), 0);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center" data-testid="transactions-loading">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="transactions-page">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="font-heading text-4xl font-bold tracking-tight text-slate-900">
            Transactions
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your income and expenses
          </p>
        </div>
        <div className="flex gap-3">
          <Dialog open={incomeDialogOpen} onOpenChange={setIncomeDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 btn-press" data-testid="add-income-btn">
                <TrendUp size={18} weight="bold" />
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
                  <Label htmlFor="income-amount">Amount ($)</Label>
                  <Input
                    id="income-amount"
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
                  <Label htmlFor="income-source">Source</Label>
                  <Select 
                    value={incomeForm.source} 
                    onValueChange={(value) => setIncomeForm({ ...incomeForm, source: value })}
                  >
                    <SelectTrigger data-testid="income-source-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INCOME_SOURCES.map(source => (
                        <SelectItem key={source.value} value={source.value}>
                          {source.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="income-description">Description</Label>
                  <Input
                    id="income-description"
                    placeholder="Monthly salary, freelance project..."
                    value={incomeForm.description}
                    onChange={(e) => setIncomeForm({ ...incomeForm, description: e.target.value })}
                    required
                    data-testid="income-description-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="income-date">Date</Label>
                  <Input
                    id="income-date"
                    type="date"
                    value={incomeForm.date}
                    onChange={(e) => setIncomeForm({ ...incomeForm, date: e.target.value })}
                    required
                    data-testid="income-date-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="income-recurring">Recurring</Label>
                  <Select 
                    value={incomeForm.recurring_period} 
                    onValueChange={(value) => setIncomeForm({ ...incomeForm, recurring_period: value })}
                  >
                    <SelectTrigger data-testid="income-recurring-select">
                      <SelectValue placeholder="One-time" />
                    </SelectTrigger>
                    <SelectContent>
                      {RECURRING_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" data-testid="submit-income-btn">
                  Add Income
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2 border-red-200 text-red-600 hover:bg-red-50 btn-press" data-testid="add-expense-btn">
                <TrendDown size={18} weight="bold" />
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
                  <Label htmlFor="expense-amount">Amount ($)</Label>
                  <Input
                    id="expense-amount"
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
                  <Label htmlFor="expense-category">Category</Label>
                  <Select 
                    value={expenseForm.category} 
                    onValueChange={(value) => setExpenseForm({ ...expenseForm, category: value })}
                  >
                    <SelectTrigger data-testid="expense-category-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expense-description">Description</Label>
                  <Input
                    id="expense-description"
                    placeholder="Lunch, groceries, Netflix..."
                    value={expenseForm.description}
                    onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                    required
                    data-testid="expense-description-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expense-date">Date</Label>
                  <Input
                    id="expense-date"
                    type="date"
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                    required
                    data-testid="expense-date-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expense-tags">Tags (optional)</Label>
                  <Input
                    id="expense-tags"
                    placeholder="work, personal, urgent..."
                    value={expenseForm.tags}
                    onChange={(e) => setExpenseForm({ ...expenseForm, tags: e.target.value })}
                    data-testid="expense-tags-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expense-recurring">Recurring</Label>
                  <Select 
                    value={expenseForm.recurring_period} 
                    onValueChange={(value) => setExpenseForm({ ...expenseForm, recurring_period: value })}
                  >
                    <SelectTrigger data-testid="expense-recurring-select">
                      <SelectValue placeholder="One-time" />
                    </SelectTrigger>
                    <SelectContent>
                      {RECURRING_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" data-testid="submit-expense-btn">
                  Add Expense
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-blue-50 border-blue-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Total Income</p>
                <p className="mt-1 font-heading text-3xl font-bold text-blue-900 matrix-number">
                  {formatCurrency(totalIncome)}
                </p>
                <p className="mt-1 text-xs text-blue-600">{income.length} entries</p>
              </div>
              <div className="icon-container bg-blue-100 p-3">
                <TrendUp size={28} weight="duotone" className="text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700">Total Expenses</p>
                <p className="mt-1 font-heading text-3xl font-bold text-red-900 matrix-number">
                  {formatCurrency(totalExpenses)}
                </p>
                <p className="mt-1 text-xs text-red-600">{expenses.length} entries</p>
              </div>
              <div className="icon-container bg-red-100 p-3">
                <TrendDown size={28} weight="duotone" className="text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Tabs */}
      <Tabs defaultValue="expenses" className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="expenses" data-testid="expenses-tab">
              <TrendDown size={16} className="mr-2" />
              Expenses
            </TabsTrigger>
            <TabsTrigger value="income" data-testid="income-tab">
              <TrendUp size={16} className="mr-2" />
              Income
            </TabsTrigger>
          </TabsList>

          {/* Search & Filter */}
          <div className="flex gap-2">
            <div className="relative">
              <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-10"
                data-testid="search-input"
              />
            </div>
          </div>
        </div>

        {/* Expenses Tab */}
        <TabsContent value="expenses">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="font-heading text-lg">All Expenses</CardTitle>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-40" data-testid="filter-category-select">
                    <Funnel size={16} className="mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {EXPENSE_CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {filteredExpenses.length > 0 ? (
                <div className="space-y-2">
                  {filteredExpenses.map((expense) => (
                    <div 
                      key={expense.id} 
                      className="flex items-center justify-between rounded-lg border border-slate-100 bg-white p-4 transition-colors hover:bg-slate-50"
                      data-testid={`expense-item-${expense.id}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`rounded-full p-2 ${CATEGORY_COLORS[expense.category] || CATEGORY_COLORS.other}`}>
                          <TrendDown size={18} weight="bold" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{expense.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`category-badge ${CATEGORY_COLORS[expense.category] || CATEGORY_COLORS.other}`}>
                              {expense.category}
                            </span>
                            <span className="text-xs text-muted-foreground">{formatDate(expense.date)}</span>
                            {expense.recurring_period && (
                              <span className="flex items-center gap-1 text-xs text-violet-600">
                                <ArrowsClockwise size={12} />
                                {expense.recurring_period.replace('_', ' ')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="font-heading text-lg font-semibold text-red-500 matrix-number">
                          -{formatCurrency(parseFloat(expense.amount))}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-slate-400 hover:text-red-600"
                          onClick={() => handleDeleteExpense(expense.id)}
                          data-testid={`delete-expense-${expense.id}`}
                        >
                          <Trash size={18} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-40 items-center justify-center text-muted-foreground">
                  <p>No expenses found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Income Tab */}
        <TabsContent value="income">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="font-heading text-lg">All Income</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredIncome.length > 0 ? (
                <div className="space-y-2">
                  {filteredIncome.map((inc) => (
                    <div 
                      key={inc.id} 
                      className="flex items-center justify-between rounded-lg border border-slate-100 bg-white p-4 transition-colors hover:bg-slate-50"
                      data-testid={`income-item-${inc.id}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`rounded-full p-2 ${CATEGORY_COLORS[inc.source] || 'bg-emerald-100 text-emerald-700'}`}>
                          <TrendUp size={18} weight="bold" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{inc.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`category-badge ${CATEGORY_COLORS[inc.source] || 'bg-emerald-100 text-emerald-700'}`}>
                              {inc.source}
                            </span>
                            <span className="text-xs text-muted-foreground">{formatDate(inc.date)}</span>
                            {inc.recurring_period && (
                              <span className="flex items-center gap-1 text-xs text-violet-600">
                                <ArrowsClockwise size={12} />
                                {inc.recurring_period.replace('_', ' ')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="font-heading text-lg font-semibold text-blue-600 matrix-number">
                          +{formatCurrency(parseFloat(inc.amount))}
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-slate-400 hover:text-red-600"
                          onClick={() => handleDeleteIncome(inc.id)}
                          data-testid={`delete-income-${inc.id}`}
                        >
                          <Trash size={18} />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-40 items-center justify-center text-muted-foreground">
                  <p>No income entries found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
