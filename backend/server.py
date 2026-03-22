from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.responses import FileResponse, StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import csv
import io
import random

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Data directory for CSVs
DATA_DIR = ROOT_DIR / 'data'
DATA_DIR.mkdir(exist_ok=True)

# CSV file paths
EXPENSES_CSV = DATA_DIR / 'expenses.csv'
INCOME_CSV = DATA_DIR / 'income.csv'
INVESTMENTS_CSV = DATA_DIR / 'investments.csv'
HABITS_CSV = DATA_DIR / 'habits.csv'
HABIT_LOGS_CSV = DATA_DIR / 'habit_logs.csv'
GOALS_CSV = DATA_DIR / 'goals.csv'

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ============== Models ==============

class ExpenseCreate(BaseModel):
    amount: float
    category: str
    description: str
    date: str
    tags: Optional[str] = ""
    recurring_period: Optional[str] = None

class Expense(BaseModel):
    id: str
    amount: float
    category: str
    description: str
    date: str
    tags: str
    recurring_period: Optional[str] = None
    created_at: str

class IncomeCreate(BaseModel):
    amount: float
    source: str
    description: str
    date: str
    recurring_period: Optional[str] = None

class Income(BaseModel):
    id: str
    amount: float
    source: str
    description: str
    date: str
    recurring_period: Optional[str] = None
    created_at: str

class InvestmentCreate(BaseModel):
    investment_type: str
    item_name: str
    quantity: float
    quantity_unit: str
    purchase_price: float
    currency: str = "USD"
    date: str
    notes: Optional[str] = ""

class Investment(BaseModel):
    id: str
    investment_type: str
    item_name: str
    quantity: float
    quantity_unit: str
    purchase_price: float
    currency: str
    date: str
    notes: str
    created_at: str

class HabitCreate(BaseModel):
    name: str
    category: str = "general"
    color: str = "#3B82F6"

class Habit(BaseModel):
    id: str
    name: str
    category: str
    color: str
    created_at: str

class HabitLogCreate(BaseModel):
    habit_id: str
    date: str
    completed: bool = True

class HabitLog(BaseModel):
    id: str
    habit_id: str
    date: str
    completed: bool
    created_at: str

class GoalCreate(BaseModel):
    title: str
    goal_type: str  # "daily" or "annual"
    target_value: Optional[int] = None
    current_value: Optional[int] = 0

class Goal(BaseModel):
    id: str
    title: str
    goal_type: str
    target_value: Optional[int]
    current_value: int
    created_at: str

# ============== CSV Helpers ==============

def init_csv_files():
    if not EXPENSES_CSV.exists():
        with open(EXPENSES_CSV, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['id', 'amount', 'category', 'description', 'date', 'tags', 'recurring_period', 'created_at'])
    
    if not INCOME_CSV.exists():
        with open(INCOME_CSV, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['id', 'amount', 'source', 'description', 'date', 'recurring_period', 'created_at'])
    
    if not INVESTMENTS_CSV.exists():
        with open(INVESTMENTS_CSV, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['id', 'investment_type', 'item_name', 'quantity', 'quantity_unit', 'purchase_price', 'currency', 'date', 'notes', 'created_at'])
    
    if not HABITS_CSV.exists():
        with open(HABITS_CSV, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['id', 'name', 'category', 'color', 'created_at'])
    
    if not HABIT_LOGS_CSV.exists():
        with open(HABIT_LOGS_CSV, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['id', 'habit_id', 'date', 'completed', 'created_at'])
    
    if not GOALS_CSV.exists():
        with open(GOALS_CSV, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['id', 'title', 'goal_type', 'target_value', 'current_value', 'created_at'])

init_csv_files()

def read_csv_as_dicts(filepath: Path) -> List[dict]:
    if not filepath.exists():
        return []
    with open(filepath, 'r', newline='') as f:
        reader = csv.DictReader(f)
        return list(reader)

def append_to_csv(filepath: Path, data: dict, fieldnames: List[str]):
    with open(filepath, 'a', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writerow(data)

def rewrite_csv(filepath: Path, data: List[dict], fieldnames: List[str]):
    with open(filepath, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(data)

# ============== Demo Data Generator ==============

def generate_demo_data():
    """Generate demo data for the past 6 months"""
    expenses = read_csv_as_dicts(EXPENSES_CSV)
    income = read_csv_as_dicts(INCOME_CSV)
    investments = read_csv_as_dicts(INVESTMENTS_CSV)
    habits = read_csv_as_dicts(HABITS_CSV)
    
    if len(expenses) > 5 and len(income) > 5:
        return {"message": "Demo data already exists"}
    
    # Clear existing data
    fieldnames_exp = ['id', 'amount', 'category', 'description', 'date', 'tags', 'recurring_period', 'created_at']
    fieldnames_inc = ['id', 'amount', 'source', 'description', 'date', 'recurring_period', 'created_at']
    fieldnames_inv = ['id', 'investment_type', 'item_name', 'quantity', 'quantity_unit', 'purchase_price', 'currency', 'date', 'notes', 'created_at']
    fieldnames_hab = ['id', 'name', 'category', 'color', 'created_at']
    fieldnames_log = ['id', 'habit_id', 'date', 'completed', 'created_at']
    
    new_expenses = []
    new_income = []
    new_investments = []
    new_habits = []
    new_logs = []
    
    today = datetime.now()
    
    # Generate 6 months of expenses
    expense_templates = [
        ('food', 'Lunch at cafe', 15, 25),
        ('food', 'Dinner delivery', 25, 45),
        ('food', 'Coffee shop', 5, 12),
        ('groceries', 'Weekly groceries', 80, 150),
        ('transport', 'Uber ride', 12, 30),
        ('transport', 'Gas station', 40, 70),
        ('entertainment', 'Netflix', 15.99, 15.99),
        ('entertainment', 'Movie tickets', 20, 35),
        ('entertainment', 'Concert tickets', 80, 150),
        ('health', 'Gym membership', 50, 50),
        ('health', 'Pharmacy', 20, 60),
        ('subscriptions', 'Spotify', 9.99, 9.99),
        ('subscriptions', 'Adobe CC', 54.99, 54.99),
        ('subscriptions', 'iCloud storage', 2.99, 2.99),
        ('utilities', 'Electric bill', 80, 150),
        ('utilities', 'Internet', 60, 60),
        ('shopping', 'Amazon purchase', 30, 200),
        ('shopping', 'Clothing', 50, 150),
    ]
    
    for month_offset in range(6):
        month_date = today - timedelta(days=30 * month_offset)
        
        # Add 15-25 expenses per month
        for _ in range(random.randint(15, 25)):
            template = random.choice(expense_templates)
            day = random.randint(1, 28)
            date = month_date.replace(day=day)
            amount = round(random.uniform(template[2], template[3]), 2)
            
            recurring = ""
            if template[0] == 'subscriptions':
                recurring = "1_month"
            
            new_expenses.append({
                'id': str(uuid.uuid4()),
                'amount': amount,
                'category': template[0],
                'description': template[1],
                'date': date.strftime('%Y-%m-%d'),
                'tags': '',
                'recurring_period': recurring,
                'created_at': datetime.now(timezone.utc).isoformat()
            })
    
    # Generate income
    income_templates = [
        ('salary', 'Monthly Salary', 5500, 5500),
        ('freelance', 'Freelance project', 500, 2000),
        ('investments', 'Dividend payment', 50, 200),
    ]
    
    for month_offset in range(6):
        month_date = today - timedelta(days=30 * month_offset)
        
        # Salary on 1st
        new_income.append({
            'id': str(uuid.uuid4()),
            'amount': 5500,
            'source': 'salary',
            'description': 'Monthly Salary',
            'date': month_date.replace(day=1).strftime('%Y-%m-%d'),
            'recurring_period': '1_month',
            'created_at': datetime.now(timezone.utc).isoformat()
        })
        
        # Random freelance
        if random.random() > 0.4:
            new_income.append({
                'id': str(uuid.uuid4()),
                'amount': round(random.uniform(500, 2000), 2),
                'source': 'freelance',
                'description': 'Freelance project',
                'date': month_date.replace(day=random.randint(5, 25)).strftime('%Y-%m-%d'),
                'recurring_period': '',
                'created_at': datetime.now(timezone.utc).isoformat()
            })
    
    # Generate investments
    investment_data = [
        ('gold', 'Gold Bar 24K', 100, 'grams', 7500),
        ('gold', 'Gold Coins', 50, 'grams', 3800),
        ('silver', 'Silver Bars', 500, 'grams', 450),
        ('stocks', 'AAPL Shares', 10, 'shares', 1750),
        ('stocks', 'GOOGL Shares', 5, 'shares', 875),
        ('stocks', 'MSFT Shares', 8, 'shares', 3200),
        ('crypto', 'Bitcoin', 0.05, 'units', 4500),
        ('property', 'Rental Property', 1, 'units', 250000),
    ]
    
    for inv in investment_data:
        date_offset = random.randint(30, 180)
        new_investments.append({
            'id': str(uuid.uuid4()),
            'investment_type': inv[0],
            'item_name': inv[1],
            'quantity': inv[2],
            'quantity_unit': inv[3],
            'purchase_price': inv[4],
            'currency': 'USD',
            'date': (today - timedelta(days=date_offset)).strftime('%Y-%m-%d'),
            'notes': '',
            'created_at': datetime.now(timezone.utc).isoformat()
        })
    
    # Create default habits
    default_habits = [
        ('Fajr Prayer', 'prayer', '#3B82F6'),
        ('Zuhr Prayer', 'prayer', '#3B82F6'),
        ('Asr Prayer', 'prayer', '#3B82F6'),
        ('Maghrib Prayer', 'prayer', '#3B82F6'),
        ('Isha Prayer', 'prayer', '#3B82F6'),
        ('Healthy Diet', 'health', '#10B981'),
        ('Gym', 'health', '#8B5CF6'),
    ]
    
    habit_ids = []
    for habit in default_habits:
        habit_id = str(uuid.uuid4())
        habit_ids.append(habit_id)
        new_habits.append({
            'id': habit_id,
            'name': habit[0],
            'category': habit[1],
            'color': habit[2],
            'created_at': datetime.now(timezone.utc).isoformat()
        })
    
    # Generate habit logs for the year
    year_start = datetime(today.year, 1, 1)
    days_so_far = (today - year_start).days
    
    for habit_id in habit_ids:
        completion_rate = random.uniform(0.6, 0.9)
        for day_offset in range(days_so_far):
            if random.random() < completion_rate:
                log_date = year_start + timedelta(days=day_offset)
                new_logs.append({
                    'id': str(uuid.uuid4()),
                    'habit_id': habit_id,
                    'date': log_date.strftime('%Y-%m-%d'),
                    'completed': 'True',
                    'created_at': datetime.now(timezone.utc).isoformat()
                })
    
    # Write all data
    rewrite_csv(EXPENSES_CSV, new_expenses, fieldnames_exp)
    rewrite_csv(INCOME_CSV, new_income, fieldnames_inc)
    rewrite_csv(INVESTMENTS_CSV, new_investments, fieldnames_inv)
    rewrite_csv(HABITS_CSV, new_habits, fieldnames_hab)
    rewrite_csv(HABIT_LOGS_CSV, new_logs, fieldnames_log)
    
    return {
        "message": "Demo data generated",
        "expenses": len(new_expenses),
        "income": len(new_income),
        "investments": len(new_investments),
        "habits": len(new_habits),
        "habit_logs": len(new_logs)
    }

# ============== Expense Endpoints ==============

@api_router.get("/expenses", response_model=List[Expense])
async def get_expenses():
    expenses = read_csv_as_dicts(EXPENSES_CSV)
    return expenses

@api_router.post("/expenses", response_model=Expense)
async def create_expense(expense: ExpenseCreate):
    expense_dict = {
        'id': str(uuid.uuid4()),
        'amount': expense.amount,
        'category': expense.category,
        'description': expense.description,
        'date': expense.date,
        'tags': expense.tags or "",
        'recurring_period': expense.recurring_period or "",
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    fieldnames = ['id', 'amount', 'category', 'description', 'date', 'tags', 'recurring_period', 'created_at']
    append_to_csv(EXPENSES_CSV, expense_dict, fieldnames)
    return expense_dict

@api_router.delete("/expenses/{expense_id}")
async def delete_expense(expense_id: str):
    expenses = read_csv_as_dicts(EXPENSES_CSV)
    expenses = [e for e in expenses if e['id'] != expense_id]
    fieldnames = ['id', 'amount', 'category', 'description', 'date', 'tags', 'recurring_period', 'created_at']
    rewrite_csv(EXPENSES_CSV, expenses, fieldnames)
    return {"message": "Expense deleted"}

# ============== Income Endpoints ==============

@api_router.get("/income", response_model=List[Income])
async def get_income():
    income = read_csv_as_dicts(INCOME_CSV)
    return income

@api_router.post("/income", response_model=Income)
async def create_income(income: IncomeCreate):
    income_dict = {
        'id': str(uuid.uuid4()),
        'amount': income.amount,
        'source': income.source,
        'description': income.description,
        'date': income.date,
        'recurring_period': income.recurring_period or "",
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    fieldnames = ['id', 'amount', 'source', 'description', 'date', 'recurring_period', 'created_at']
    append_to_csv(INCOME_CSV, income_dict, fieldnames)
    return income_dict

@api_router.delete("/income/{income_id}")
async def delete_income(income_id: str):
    income = read_csv_as_dicts(INCOME_CSV)
    income = [i for i in income if i['id'] != income_id]
    fieldnames = ['id', 'amount', 'source', 'description', 'date', 'recurring_period', 'created_at']
    rewrite_csv(INCOME_CSV, income, fieldnames)
    return {"message": "Income deleted"}

# ============== Investment Endpoints ==============

@api_router.get("/investments", response_model=List[Investment])
async def get_investments():
    investments = read_csv_as_dicts(INVESTMENTS_CSV)
    return investments

@api_router.post("/investments", response_model=Investment)
async def create_investment(investment: InvestmentCreate):
    investment_dict = {
        'id': str(uuid.uuid4()),
        'investment_type': investment.investment_type,
        'item_name': investment.item_name,
        'quantity': investment.quantity,
        'quantity_unit': investment.quantity_unit,
        'purchase_price': investment.purchase_price,
        'currency': investment.currency,
        'date': investment.date,
        'notes': investment.notes or "",
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    fieldnames = ['id', 'investment_type', 'item_name', 'quantity', 'quantity_unit', 'purchase_price', 'currency', 'date', 'notes', 'created_at']
    append_to_csv(INVESTMENTS_CSV, investment_dict, fieldnames)
    return investment_dict

@api_router.delete("/investments/{investment_id}")
async def delete_investment(investment_id: str):
    investments = read_csv_as_dicts(INVESTMENTS_CSV)
    investments = [i for i in investments if i['id'] != investment_id]
    fieldnames = ['id', 'investment_type', 'item_name', 'quantity', 'quantity_unit', 'purchase_price', 'currency', 'date', 'notes', 'created_at']
    rewrite_csv(INVESTMENTS_CSV, investments, fieldnames)
    return {"message": "Investment deleted"}

# ============== Habit Endpoints ==============

@api_router.get("/habits")
async def get_habits():
    habits = read_csv_as_dicts(HABITS_CSV)
    return habits

@api_router.post("/habits")
async def create_habit(habit: HabitCreate):
    habit_dict = {
        'id': str(uuid.uuid4()),
        'name': habit.name,
        'category': habit.category,
        'color': habit.color,
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    fieldnames = ['id', 'name', 'category', 'color', 'created_at']
    append_to_csv(HABITS_CSV, habit_dict, fieldnames)
    return habit_dict

@api_router.delete("/habits/{habit_id}")
async def delete_habit(habit_id: str):
    habits = read_csv_as_dicts(HABITS_CSV)
    habits = [h for h in habits if h['id'] != habit_id]
    fieldnames = ['id', 'name', 'category', 'color', 'created_at']
    rewrite_csv(HABITS_CSV, habits, fieldnames)
    # Also delete related logs
    logs = read_csv_as_dicts(HABIT_LOGS_CSV)
    logs = [l for l in logs if l['habit_id'] != habit_id]
    fieldnames_log = ['id', 'habit_id', 'date', 'completed', 'created_at']
    rewrite_csv(HABIT_LOGS_CSV, logs, fieldnames_log)
    return {"message": "Habit deleted"}

@api_router.get("/habit-logs")
async def get_habit_logs():
    logs = read_csv_as_dicts(HABIT_LOGS_CSV)
    return logs

@api_router.post("/habit-logs")
async def create_habit_log(log: HabitLogCreate):
    logs = read_csv_as_dicts(HABIT_LOGS_CSV)
    # Check if log exists for this habit and date
    existing = [l for l in logs if l['habit_id'] == log.habit_id and l['date'] == log.date]
    
    if existing:
        # Toggle - remove if exists
        logs = [l for l in logs if not (l['habit_id'] == log.habit_id and l['date'] == log.date)]
        fieldnames = ['id', 'habit_id', 'date', 'completed', 'created_at']
        rewrite_csv(HABIT_LOGS_CSV, logs, fieldnames)
        return {"message": "Log removed", "action": "removed"}
    else:
        log_dict = {
            'id': str(uuid.uuid4()),
            'habit_id': log.habit_id,
            'date': log.date,
            'completed': str(log.completed),
            'created_at': datetime.now(timezone.utc).isoformat()
        }
        fieldnames = ['id', 'habit_id', 'date', 'completed', 'created_at']
        append_to_csv(HABIT_LOGS_CSV, log_dict, fieldnames)
        return {"message": "Log created", "action": "created", "log": log_dict}

# ============== Goals Endpoints ==============

@api_router.get("/goals")
async def get_goals():
    goals = read_csv_as_dicts(GOALS_CSV)
    return goals

@api_router.post("/goals")
async def create_goal(goal: GoalCreate):
    goal_dict = {
        'id': str(uuid.uuid4()),
        'title': goal.title,
        'goal_type': goal.goal_type,
        'target_value': goal.target_value or 0,
        'current_value': goal.current_value or 0,
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    fieldnames = ['id', 'title', 'goal_type', 'target_value', 'current_value', 'created_at']
    append_to_csv(GOALS_CSV, goal_dict, fieldnames)
    return goal_dict

@api_router.put("/goals/{goal_id}")
async def update_goal(goal_id: str, current_value: int):
    goals = read_csv_as_dicts(GOALS_CSV)
    for g in goals:
        if g['id'] == goal_id:
            g['current_value'] = current_value
    fieldnames = ['id', 'title', 'goal_type', 'target_value', 'current_value', 'created_at']
    rewrite_csv(GOALS_CSV, goals, fieldnames)
    return {"message": "Goal updated"}

@api_router.delete("/goals/{goal_id}")
async def delete_goal(goal_id: str):
    goals = read_csv_as_dicts(GOALS_CSV)
    goals = [g for g in goals if g['id'] != goal_id]
    fieldnames = ['id', 'title', 'goal_type', 'target_value', 'current_value', 'created_at']
    rewrite_csv(GOALS_CSV, goals, fieldnames)
    return {"message": "Goal deleted"}

# ============== Dashboard/Summary Endpoints ==============

@api_router.get("/dashboard/summary")
async def get_dashboard_summary():
    expenses = read_csv_as_dicts(EXPENSES_CSV)
    income = read_csv_as_dicts(INCOME_CSV)
    investments = read_csv_as_dicts(INVESTMENTS_CSV)
    
    total_expenses = sum(float(e['amount']) for e in expenses)
    total_income = sum(float(i['amount']) for i in income)
    total_investments = sum(float(inv['purchase_price']) for inv in investments)
    net_savings = total_income - total_expenses
    total_wealth = net_savings + total_investments
    
    # Category breakdown
    category_totals = {}
    for e in expenses:
        cat = e['category']
        category_totals[cat] = category_totals.get(cat, 0) + float(e['amount'])
    
    # Monthly trends
    monthly_data = {}
    for e in expenses:
        month = e['date'][:7]
        if month not in monthly_data:
            monthly_data[month] = {'income': 0, 'expense': 0}
        monthly_data[month]['expense'] += float(e['amount'])
    
    for i in income:
        month = i['date'][:7]
        if month not in monthly_data:
            monthly_data[month] = {'income': 0, 'expense': 0}
        monthly_data[month]['income'] += float(i['amount'])
    
    sorted_months = sorted(monthly_data.keys())
    monthly_trend = [
        {'month': m, 'income': monthly_data[m]['income'], 'expense': monthly_data[m]['expense'], 'savings': monthly_data[m]['income'] - monthly_data[m]['expense']}
        for m in sorted_months
    ]
    
    # Subscriptions
    subscriptions = [e for e in expenses if e.get('recurring_period') and e['recurring_period'] != ""]
    
    # Investment breakdown
    investment_by_type = {}
    for inv in investments:
        inv_type = inv['investment_type']
        investment_by_type[inv_type] = investment_by_type.get(inv_type, 0) + float(inv['purchase_price'])
    
    # Calendar data - expenses and income by date
    calendar_data = {}
    for e in expenses:
        date = e['date']
        if date not in calendar_data:
            calendar_data[date] = {'expenses': 0, 'income': 0, 'expense_items': [], 'income_items': []}
        calendar_data[date]['expenses'] += float(e['amount'])
        calendar_data[date]['expense_items'].append({'description': e['description'], 'amount': float(e['amount']), 'category': e['category']})
    
    for i in income:
        date = i['date']
        if date not in calendar_data:
            calendar_data[date] = {'expenses': 0, 'income': 0, 'expense_items': [], 'income_items': []}
        calendar_data[date]['income'] += float(i['amount'])
        calendar_data[date]['income_items'].append({'description': i['description'], 'amount': float(i['amount']), 'source': i['source']})
    
    return {
        'total_expenses': total_expenses,
        'total_income': total_income,
        'total_investments': total_investments,
        'net_savings': net_savings,
        'total_wealth': total_wealth,
        'savings_rate': (net_savings / total_income * 100) if total_income > 0 else 0,
        'category_breakdown': [{'category': k, 'amount': v} for k, v in category_totals.items()],
        'monthly_trend': monthly_trend,
        'subscriptions': subscriptions,
        'investment_breakdown': [{'type': k, 'amount': v} for k, v in investment_by_type.items()],
        'calendar_data': calendar_data,
        'expense_count': len(expenses),
        'income_count': len(income),
        'investment_count': len(investments)
    }

@api_router.get("/life-os/summary")
async def get_life_os_summary():
    habits = read_csv_as_dicts(HABITS_CSV)
    logs = read_csv_as_dicts(HABIT_LOGS_CSV)
    goals = read_csv_as_dicts(GOALS_CSV)
    
    today = datetime.now()
    year_start = datetime(today.year, 1, 1)
    year_end = datetime(today.year, 12, 31)
    month_end = (today.replace(day=1) + timedelta(days=32)).replace(day=1) - timedelta(days=1)
    
    days_in_year = (year_end - year_start).days + 1
    days_passed = (today - year_start).days + 1
    days_remaining_year = days_in_year - days_passed
    days_remaining_month = (month_end - today).days
    year_progress = (days_passed / days_in_year) * 100
    
    # Habit completion stats
    habit_stats = []
    for habit in habits:
        habit_logs = [l for l in logs if l['habit_id'] == habit['id'] and l['completed'] == 'True']
        completion_rate = (len(habit_logs) / days_passed * 100) if days_passed > 0 else 0
        habit_stats.append({
            'id': habit['id'],
            'name': habit['name'],
            'category': habit['category'],
            'color': habit['color'],
            'total_completions': len(habit_logs),
            'completion_rate': round(completion_rate, 1)
        })
    
    # Today's completion
    today_str = today.strftime('%Y-%m-%d')
    today_logs = [l for l in logs if l['date'] == today_str]
    today_completed = len(today_logs)
    
    return {
        'days_remaining_month': days_remaining_month,
        'days_remaining_year': days_remaining_year,
        'year_progress': round(year_progress, 1),
        'days_passed': days_passed,
        'habits': habit_stats,
        'goals': goals,
        'today_completed': today_completed,
        'total_habits': len(habits),
        'logs': logs
    }

# ============== Demo Data Endpoint ==============

@api_router.post("/generate-demo-data")
async def api_generate_demo_data():
    return generate_demo_data()

# ============== Export Endpoints ==============

@api_router.get("/export/master")
async def export_master_csv():
    expenses = read_csv_as_dicts(EXPENSES_CSV)
    income = read_csv_as_dicts(INCOME_CSV)
    investments = read_csv_as_dicts(INVESTMENTS_CSV)
    
    output = io.StringIO()
    
    output.write("=== EXPENSES ===\n")
    if expenses:
        writer = csv.DictWriter(output, fieldnames=expenses[0].keys())
        writer.writeheader()
        writer.writerows(expenses)
    
    output.write("\n=== INCOME ===\n")
    if income:
        writer = csv.DictWriter(output, fieldnames=income[0].keys())
        writer.writeheader()
        writer.writerows(income)
    
    output.write("\n=== INVESTMENTS ===\n")
    if investments:
        writer = csv.DictWriter(output, fieldnames=investments[0].keys())
        writer.writeheader()
        writer.writerows(investments)
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=wealthdock_master_export.csv"}
    )

@api_router.get("/categories")
async def get_categories():
    return {
        'expense_categories': ['food', 'transport', 'entertainment', 'groceries', 'health', 'subscriptions', 'utilities', 'shopping', 'other'],
        'income_sources': ['salary', 'freelance', 'investments', 'rental', 'business', 'other'],
        'investment_types': ['gold', 'silver', 'property', 'stocks', 'crypto', 'bonds', 'mutual_funds', 'other']
    }

@api_router.get("/")
async def root():
    return {"message": "WealthDock API", "version": "1.0.0"}

# Include the router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
