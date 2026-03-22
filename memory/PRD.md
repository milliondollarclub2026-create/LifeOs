# WealthDock - Personal Finance & Life OS Tracker

## Original Problem Statement
Personal finance tracker with Life OS capabilities. Blue theme (no green/purple), modern typography with retro dot-matrix style, local CSV storage, calendar view for transactions, habit tracker with circular checkbox grid.

## Architecture
- **Frontend**: React with Tailwind CSS, Recharts, Phosphor icons, shadcn/UI
- **Backend**: FastAPI with CSV file storage in /app/backend/data/
- **Fonts**: Syne (headings), DM Sans (body), Space Mono (numbers with matrix effect)
- **Theme**: Blue primary (#3B82F6), violet accent, light mode

## User Personas
- Single personal user tracking finances, investments, and daily habits

## Core Requirements
1. Dashboard with Total Wealth banner, interactive charts
2. Calendar view showing income/expenses by date
3. Transactions page for income/expenses with recurring options
4. Investments page for gold, silver, stocks, property
5. Life OS habit tracker with circular checkbox grid (30 days x habits)
6. Progress tracking: year progress, days remaining in month/year

## What's Been Implemented (March 22, 2026)
- ✅ Dashboard with Total Wealth banner (blue/violet gradient)
- ✅ Blue theme throughout (removed green)
- ✅ Modern fonts: Syne, DM Sans, Space Mono with matrix number effect
- ✅ 4 stat cards: Income, Expenses, Savings, Investments
- ✅ Charts: Line (income vs expenses), Donut (spending by category), Bar (savings)
- ✅ Calendar page with monthly view and date details panel
- ✅ Transaction indicators on calendar (blue=income, red=expense)
- ✅ Life OS page with year progress ring
- ✅ Habit tracker with 7 default habits (5 prayers + Healthy Diet + Gym)
- ✅ Circular checkbox grid for habit tracking
- ✅ Days remaining counters (month and year)
- ✅ Add Habit / Add Goal dialogs
- ✅ Completion rate stats per habit
- ✅ Demo data generator
- ✅ CSV export functionality

## Prioritized Backlog
### P0 (Critical)
- None remaining

### P1 (High Priority)
- Gold/silver price fetching API
- Annual goals progress tracking
- Habit streaks calculation

### P2 (Medium Priority)
- Budget limits and alerts
- Monthly reports generation
- Custom habit colors
- Dark mode toggle

## Next Tasks
1. Implement real-time gold/silver price fetching
2. Add habit streak tracking (consecutive days)
3. Build budget management feature
