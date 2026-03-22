# WealthDock - Personal Finance Tracker

## Original Problem Statement
Personal finance tracker Mac dock app with local CSV storage. Light themed, modern design for personal use only.

## Architecture
- **Frontend**: React with Tailwind CSS, Recharts for charts, Phosphor icons, shadcn/UI components
- **Backend**: FastAPI with CSV file storage
- **Fonts**: Outfit (headings), Plus Jakarta Sans (body), JetBrains Mono (numbers)
- **Data Storage**: CSV files in `/app/backend/data/` (expenses.csv, income.csv, investments.csv)

## User Personas
- Single personal user tracking finances, investments, and eventually habits

## Core Requirements
1. Dashboard with interactive charts (income vs expenses, savings progression, spending by category)
2. Transactions page for income/expenses with recurring options (1, 6, 12 months)
3. Investments page for tracking gold, silver, property, stocks with quantity units
4. Local CSV storage with export functionality
5. Light theme, modern clean design

## What's Been Implemented (March 22, 2026)
- ✅ Dashboard with 4 stat cards (Total Income, Expenses, Savings, Investments)
- ✅ Interactive charts: Line chart (income vs expenses), Donut chart (spending by category), Bar chart (savings)
- ✅ Subscriptions widget showing recurring expenses
- ✅ Transactions page with income/expense forms, category selection, recurring options
- ✅ Investments page with portfolio breakdown pie chart, growth timeline chart
- ✅ Sidebar navigation with collapsible design
- ✅ Export All CSV functionality
- ✅ Delete functionality for all entries
- ✅ Custom fonts (Outfit, Plus Jakarta Sans)
- ✅ Phosphor icons throughout

## Prioritized Backlog
### P0 (Critical)
- None remaining

### P1 (High Priority)
- Gold/Silver price fetching from web API
- Stock price fetching (user mentioned this for future)
- Budget limits and alerts

### P2 (Medium Priority)  
- Data import from CSV
- Monthly reports generation
- Habit tracker module (user mentioned life OS expansion)
- Custom category creation UI

## Next Tasks
1. Implement gold/silver price fetching via free API
2. Add budget tracking feature
3. Build habit tracker as next module
