# Finance Tracker — Personal Budget Manager

A comprehensive personal finance tracking web application built with vanilla HTML, CSS, and JavaScript. All data is stored locally in the browser using LocalStorage — no server or database required.

## Features

### Core
- **Multi-Account Management** — Create and manage multiple accounts (Checking, Savings, Investment, Crypto)
- **Transaction Tracking** — Record income and expenses with categories, descriptions, dates, and receipt uploads
- **Account Transfers** — Transfer funds between accounts with automatic balance updates
- **Budget Management** — Set monthly spending limits per category with visual progress tracking

### Goals & Expenses
- **Savings Goals** — Set financial goals with target amounts, deadlines, and progress tracking
- **Upcoming Expenses** — Track upcoming bills with due dates, recurring expense support, and bill reminders
- **Pay & Add Money Popovers** — Quick-action popovers to pay bills or fund goals directly from any account

### Analytics & Reports
- **Summary Dashboard** — Monthly income vs. expense overview with net balance
- **Charts** — Income/expense bar chart, category breakdown doughnut/pie charts, account distribution, and 6-month trend line chart (powered by Chart.js)
- **Top Category Detection** — Identifies your highest spending category each month

### Data Management
- **CSV Export** — Export all transactions as a `.csv` file
- **Backup & Restore** — Export/import full data as JSON backup files
- **Reset All Data** — Clear everything and start fresh

### User Experience
- **Dark/Light Mode** — Toggle between themes with persistent preference
- **Multi-Currency Display** — View amounts in 10 currencies (LKR, USD, EUR, GBP, INR, JPY, AUD, CAD, AED, SAR)
- **Custom Categories** — Add your own income/expense categories alongside defaults
- **Bill Reminders** — Configurable reminder banner for bills due within X days
- **Responsive Design** — Works on desktop, tablet, and mobile
- **Receipt Uploads** — Attach receipt images to transactions via drag & drop or file picker
- **Smart Validation** — Insufficient funds warnings, overdraft confirmation, locked category selection until type is chosen

## Tech Stack

| Technology | Purpose |
|---|---|
| HTML5 | Structure & markup |
| CSS3 (Custom Properties) | Styling, theming, responsive layout |
| Vanilla JavaScript (ES6) | Application logic, DOM manipulation |
| [Chart.js 4.x](https://www.chartjs.org/) | Charts & analytics (CDN) |
| [Font Awesome 6.4](https://fontawesome.com/) | Icons (CDN) |
| [Google Fonts (Inter)](https://fonts.google.com/specimen/Inter) | Typography (CDN) |
| LocalStorage | Client-side data persistence |

> No build tools, frameworks, or server-side dependencies. Everything runs in the browser.

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Edge, Safari)

### Run the App

1. **Clone the repository**
   ```bash
   git clone https://github.com/<svitharana>/finance-tracker.git
   cd finance-tracker
   ```

2. **Open in browser** — Simply open `index.html`:
   - **Double-click** `index.html` in your file explorer, OR
   - **Right-click** → Open with → your browser

3. **(Optional) Use VS Code Live Server** for auto-reload during development:
   - Install the [Live Server](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer) extension
   - Right-click `index.html` → "Open with Live Server"

That's it — no installation, no `npm install`, no build step.

### Load Sample Data (Optional)

To quickly populate the app with 6 months of realistic dummy data:

1. Open the app in your browser
2. Open DevTools (`F12`) → **Console** tab
3. Copy and paste the contents of `seed-data.js` into the console
4. Press Enter, then refresh the page

This creates 3 accounts, 70+ transactions, goals, budgets, and upcoming expenses.

## Project Structure

```
finance-tracker/
├── index.html       # Main HTML page (single-page app)
├── styles.css       # All styles, theming, responsive design
├── script.js        # Application logic (FinanceTracker class)
├── seed-data.js     # Optional: dummy data generator (browser console)
└── README.md        # This file
```

## How It Works

The entire application runs as a **single-page app** inside one HTML file. Navigation between pages (Home, Transactions, Accounts, Budgets, Summary) is handled by toggling visibility of `<div>` sections — no page reloads.

All data is stored in the browser's **LocalStorage** under the key `financeTrackerData` as a JSON object. This means:
- Data persists across browser sessions
- Data is per-browser (not synced across devices)
- Clearing browser data will erase the app data (use Backup to save it)

### Architecture

- **Single Class**: `FinanceTracker` — manages all state, events, rendering, and storage
- **No Dependencies**: Pure vanilla JS with zero npm packages
- **CDN Libraries**: Chart.js for charts, Font Awesome for icons, Google Fonts for typography

## License

This project is for educational purposes.
