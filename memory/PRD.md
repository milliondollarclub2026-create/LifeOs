# WealthDock - Personal Finance & Life OS Tracker

## Original Problem Statement
Personal finance tracker with Life OS capabilities. Unified blue color scheme (no green/purple/gradients), modern fonts with dot-matrix style for KPIs, clean professional design, pagination, category filtering.

## Architecture
- **Frontend**: React, Tailwind CSS, Recharts, Phosphor icons, shadcn/UI
- **Backend**: FastAPI with CSV storage (/app/backend/data/)
- **Fonts**: Syne (headings), DM Sans (body), Space Mono (monospace numbers)
- **Color Scheme**: Blue primary (#3B82F6), Red for expenses (#EF4444)

## Design System
- No gradients on cards or stat elements
- Dot-matrix style for large KPI numbers
- Consistent blue hover effects (border-color transition)
- Clean white card backgrounds with subtle borders
- Pagination: 25 items per page for transactions, 12 for investments

## Features Implemented (March 22, 2026)

### Dashboard
- Total Wealth banner with dot-matrix numbers
- 4 stat cards (Income, Expenses, Savings, Investments)
- Financial Overview chart (bars + cumulative line)
- Spending by Category donut chart
- Savings Trend area chart
- Active Subscriptions list

### Calendar
- Monthly calendar with transaction indicators (bars not dots)
- Day details panel showing income/expense breakdown
- Monthly summary cards

### Transactions
- Expense/Income tabs
- Search functionality
- Pagination (25 per page)
- Add Income/Expense dialogs with recurring options
- Clean list view with colored indicators

### Investments
- Portfolio Breakdown horizontal bar chart (handles property dominance)
- Investment Growth area chart
- Category filter tabs (All, Gold, Silver, Stocks, etc.)
- Card grid with metadata (quantity, value, date)
- Pagination (12 per page)

### Life OS
- Year progress ring
- Days remaining (month/year) stats
- Full-width habit tracker grid (31 days)
- Circular checkboxes with completion colors
- Completion rates bar chart per habit
- Goals management (daily/annual)
- Default habits: 5 Prayers, Healthy Diet, Gym

## Prioritized Backlog
### P1
- Gold/silver price API integration
- Habit streak calculation
- Budget limits with alerts

### P2
- Dark mode toggle
- Data import from CSV
- Monthly PDF reports
