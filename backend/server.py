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
from datetime import datetime, timezone
import csv
import io
import pandas as pd

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Data directory for CSVs
DATA_DIR = ROOT_DIR / 'data'
DATA_DIR.mkdir(exist_ok=True)

# CSV file paths
EXPENSES_CSV = DATA_DIR / 'expenses.csv'
INCOME_CSV = DATA_DIR / 'income.csv'
INVESTMENTS_CSV = DATA_DIR / 'investments.csv'

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
    recurring_period: Optional[str] = None  # "1_month", "6_months", "12_months"

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
    investment_type: str  # "gold", "silver", "property", "stocks", "other"
    item_name: str
    quantity: float
    quantity_unit: str  # "grams", "oz", "units", "sqft"
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

# ============== CSV Helpers ==============

def init_csv_files():
    """Initialize CSV files with headers if they don't exist"""
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

init_csv_files()

def read_csv_as_dicts(filepath: Path) -> List[dict]:
    """Read CSV file and return list of dictionaries"""
    if not filepath.exists():
        return []
    with open(filepath, 'r', newline='') as f:
        reader = csv.DictReader(f)
        return list(reader)

def append_to_csv(filepath: Path, data: dict, fieldnames: List[str]):
    """Append a row to CSV file"""
    with open(filepath, 'a', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writerow(data)

def rewrite_csv(filepath: Path, data: List[dict], fieldnames: List[str]):
    """Rewrite entire CSV file with new data"""
    with open(filepath, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(data)

# ============== Expense Endpoints ==============

@api_router.get("/expenses", response_model=List[Expense])
async def get_expenses():
    """Get all expenses"""
    expenses = read_csv_as_dicts(EXPENSES_CSV)
    return expenses

@api_router.post("/expenses", response_model=Expense)
async def create_expense(expense: ExpenseCreate):
    """Create a new expense"""
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
    """Delete an expense"""
    expenses = read_csv_as_dicts(EXPENSES_CSV)
    expenses = [e for e in expenses if e['id'] != expense_id]
    fieldnames = ['id', 'amount', 'category', 'description', 'date', 'tags', 'recurring_period', 'created_at']
    rewrite_csv(EXPENSES_CSV, expenses, fieldnames)
    return {"message": "Expense deleted"}

# ============== Income Endpoints ==============

@api_router.get("/income", response_model=List[Income])
async def get_income():
    """Get all income entries"""
    income = read_csv_as_dicts(INCOME_CSV)
    return income

@api_router.post("/income", response_model=Income)
async def create_income(income: IncomeCreate):
    """Create a new income entry"""
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
    """Delete an income entry"""
    income = read_csv_as_dicts(INCOME_CSV)
    income = [i for i in income if i['id'] != income_id]
    fieldnames = ['id', 'amount', 'source', 'description', 'date', 'recurring_period', 'created_at']
    rewrite_csv(INCOME_CSV, income, fieldnames)
    return {"message": "Income deleted"}

# ============== Investment Endpoints ==============

@api_router.get("/investments", response_model=List[Investment])
async def get_investments():
    """Get all investments"""
    investments = read_csv_as_dicts(INVESTMENTS_CSV)
    return investments

@api_router.post("/investments", response_model=Investment)
async def create_investment(investment: InvestmentCreate):
    """Create a new investment entry"""
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
    """Delete an investment"""
    investments = read_csv_as_dicts(INVESTMENTS_CSV)
    investments = [i for i in investments if i['id'] != investment_id]
    fieldnames = ['id', 'investment_type', 'item_name', 'quantity', 'quantity_unit', 'purchase_price', 'currency', 'date', 'notes', 'created_at']
    rewrite_csv(INVESTMENTS_CSV, investments, fieldnames)
    return {"message": "Investment deleted"}

# ============== Dashboard/Summary Endpoints ==============

@api_router.get("/dashboard/summary")
async def get_dashboard_summary():
    """Get summary statistics for dashboard"""
    expenses = read_csv_as_dicts(EXPENSES_CSV)
    income = read_csv_as_dicts(INCOME_CSV)
    investments = read_csv_as_dicts(INVESTMENTS_CSV)
    
    total_expenses = sum(float(e['amount']) for e in expenses)
    total_income = sum(float(i['amount']) for i in income)
    total_investments = sum(float(inv['purchase_price']) for inv in investments)
    net_savings = total_income - total_expenses
    
    # Category breakdown
    category_totals = {}
    for e in expenses:
        cat = e['category']
        category_totals[cat] = category_totals.get(cat, 0) + float(e['amount'])
    
    # Monthly trends (last 12 months)
    monthly_data = {}
    for e in expenses:
        month = e['date'][:7]  # YYYY-MM
        if month not in monthly_data:
            monthly_data[month] = {'income': 0, 'expense': 0}
        monthly_data[month]['expense'] += float(e['amount'])
    
    for i in income:
        month = i['date'][:7]
        if month not in monthly_data:
            monthly_data[month] = {'income': 0, 'expense': 0}
        monthly_data[month]['income'] += float(i['amount'])
    
    # Sort by month
    sorted_months = sorted(monthly_data.keys())
    monthly_trend = [
        {'month': m, 'income': monthly_data[m]['income'], 'expense': monthly_data[m]['expense'], 'savings': monthly_data[m]['income'] - monthly_data[m]['expense']}
        for m in sorted_months
    ]
    
    # Subscriptions (recurring expenses)
    subscriptions = [e for e in expenses if e.get('recurring_period') and e['recurring_period'] != ""]
    
    # Investment breakdown by type
    investment_by_type = {}
    for inv in investments:
        inv_type = inv['investment_type']
        investment_by_type[inv_type] = investment_by_type.get(inv_type, 0) + float(inv['purchase_price'])
    
    return {
        'total_expenses': total_expenses,
        'total_income': total_income,
        'total_investments': total_investments,
        'net_savings': net_savings,
        'savings_rate': (net_savings / total_income * 100) if total_income > 0 else 0,
        'category_breakdown': [{'category': k, 'amount': v} for k, v in category_totals.items()],
        'monthly_trend': monthly_trend,
        'subscriptions': subscriptions,
        'investment_breakdown': [{'type': k, 'amount': v} for k, v in investment_by_type.items()],
        'expense_count': len(expenses),
        'income_count': len(income),
        'investment_count': len(investments)
    }

# ============== Export Endpoints ==============

@api_router.get("/export/master")
async def export_master_csv():
    """Export all data as a single master CSV"""
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

@api_router.get("/export/expenses")
async def export_expenses_csv():
    """Export expenses as CSV"""
    return FileResponse(EXPENSES_CSV, media_type="text/csv", filename="expenses.csv")

@api_router.get("/export/income")
async def export_income_csv():
    """Export income as CSV"""
    return FileResponse(INCOME_CSV, media_type="text/csv", filename="income.csv")

@api_router.get("/export/investments")
async def export_investments_csv():
    """Export investments as CSV"""
    return FileResponse(INVESTMENTS_CSV, media_type="text/csv", filename="investments.csv")

# ============== Categories Endpoint ==============

@api_router.get("/categories")
async def get_categories():
    """Get default expense categories"""
    return {
        'expense_categories': ['food', 'transport', 'entertainment', 'groceries', 'health', 'subscriptions', 'utilities', 'shopping', 'other'],
        'income_sources': ['salary', 'freelance', 'investments', 'rental', 'business', 'other'],
        'investment_types': ['gold', 'silver', 'property', 'stocks', 'crypto', 'bonds', 'mutual_funds', 'other']
    }

@api_router.get("/")
async def root():
    return {"message": "WealthDock API", "version": "1.0.0"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
