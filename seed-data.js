// Paste this into your browser console to load dummy data
// After running, refresh the page

(function() {
    const now = new Date();
    const accounts = [
        { id: 'acc_1', name: 'Main Account', type: 'checking', balance: 0, createdAt: '2025-10-01T00:00:00.000Z' },
        { id: 'acc_2', name: 'Savings', type: 'savings', balance: 0, createdAt: '2025-10-01T00:00:00.000Z' },
        { id: 'acc_3', name: 'Investment', type: 'investment', balance: 0, createdAt: '2025-11-01T00:00:00.000Z' }
    ];

    const transactions = [];
    let id = 1;

    // Generate 6 months of data (Oct 2025 - Mar 2026)
    const months = [
        { year: 2025, month: 10 }, { year: 2025, month: 11 }, { year: 2025, month: 12 },
        { year: 2026, month: 1 },  { year: 2026, month: 2 },  { year: 2026, month: 3 }
    ];

    const incomeItems = [
        { category: 'salary', desc: 'Monthly Salary', amount: 150000, account: 'acc_1' },
        { category: 'freelance', desc: 'Web Design Project', amount: 35000, account: 'acc_1' },
        { category: 'freelance', desc: 'Logo Design', amount: 15000, account: 'acc_1' },
        { category: 'investment', desc: 'Stock Dividends', amount: 8000, account: 'acc_3' },
        { category: 'bonus', desc: 'Performance Bonus', amount: 25000, account: 'acc_1' },
    ];

    const expenseItems = [
        { category: 'rent', desc: 'Monthly Rent', amount: 45000, account: 'acc_1', day: 1 },
        { category: 'utilities', desc: 'Electricity Bill', amountRange: [3500, 6000], account: 'acc_1' },
        { category: 'utilities', desc: 'Water Bill', amountRange: [1200, 2000], account: 'acc_1' },
        { category: 'utilities', desc: 'Internet & WiFi', amount: 3500, account: 'acc_1' },
        { category: 'food', desc: 'Groceries - Keells', amountRange: [8000, 15000], account: 'acc_1' },
        { category: 'food', desc: 'Groceries - Cargills', amountRange: [3000, 7000], account: 'acc_1' },
        { category: 'food', desc: 'Dining Out', amountRange: [2000, 5000], account: 'acc_1' },
        { category: 'transportation', desc: 'Fuel', amountRange: [6000, 10000], account: 'acc_1' },
        { category: 'transportation', desc: 'Bus/Train Pass', amount: 4500, account: 'acc_1' },
        { category: 'healthcare', desc: 'Pharmacy', amountRange: [1500, 4000], account: 'acc_1' },
        { category: 'entertainment', desc: 'Netflix Subscription', amount: 1800, account: 'acc_1' },
        { category: 'entertainment', desc: 'Spotify', amount: 900, account: 'acc_1' },
        { category: 'shopping', desc: 'Clothing', amountRange: [3000, 8000], account: 'acc_1' },
        { category: 'education', desc: 'Online Course', amountRange: [5000, 12000], account: 'acc_1' },
        { category: 'subscription', desc: 'Cloud Storage', amount: 500, account: 'acc_1' },
        { category: 'food', desc: 'Coffee - Barista', amountRange: [800, 1500], account: 'acc_1' },
    ];

    function randBetween(min, max) {
        return Math.round(min + Math.random() * (max - min));
    }

    function randDay(month, year) {
        const maxDay = new Date(year, month, 0).getDate();
        return randBetween(1, Math.min(maxDay, 28));
    }

    months.forEach(m => {
        // Salary every month
        transactions.push({
            id: 'trans_seed_' + (id++),
            date: m.year + '-' + String(m.month).padStart(2,'0') + '-' + String(randBetween(1,5)).padStart(2,'0'),
            type: 'income', category: 'salary', amount: 150000, accountId: 'acc_1',
            description: 'Monthly Salary', receipt: null, createdAt: new Date().toISOString()
        });

        // Freelance income (some months)
        if (Math.random() > 0.4) {
            const fi = incomeItems[randBetween(1, 2)];
            transactions.push({
                id: 'trans_seed_' + (id++),
                date: m.year + '-' + String(m.month).padStart(2,'0') + '-' + String(randBetween(10,25)).padStart(2,'0'),
                type: 'income', category: fi.category, amount: fi.amount + randBetween(-5000, 10000),
                accountId: fi.account, description: fi.desc, receipt: null,
                createdAt: new Date().toISOString()
            });
        }

        // Investment income (every other month)
        if (m.month % 2 === 0) {
            transactions.push({
                id: 'trans_seed_' + (id++),
                date: m.year + '-' + String(m.month).padStart(2,'0') + '-15',
                type: 'income', category: 'investment', amount: randBetween(5000, 12000),
                accountId: 'acc_3', description: 'Stock Dividends', receipt: null,
                createdAt: new Date().toISOString()
            });
        }

        // Bonus (Dec and Mar)
        if (m.month === 12 || m.month === 3) {
            transactions.push({
                id: 'trans_seed_' + (id++),
                date: m.year + '-' + String(m.month).padStart(2,'0') + '-' + String(randBetween(20,28)).padStart(2,'0'),
                type: 'income', category: 'bonus', amount: 25000,
                accountId: 'acc_1', description: 'Performance Bonus', receipt: null,
                createdAt: new Date().toISOString()
            });
        }

        // Regular expenses every month
        expenseItems.forEach(exp => {
            // Skip some optional expenses randomly
            if (['shopping', 'healthcare', 'education'].includes(exp.category) && Math.random() > 0.5) return;
            if (exp.desc === 'Coffee - Barista' && Math.random() > 0.6) return;

            const amount = exp.amountRange ? randBetween(exp.amountRange[0], exp.amountRange[1]) : exp.amount;
            const day = exp.day || randDay(m.month, m.year);
            transactions.push({
                id: 'trans_seed_' + (id++),
                date: m.year + '-' + String(m.month).padStart(2,'0') + '-' + String(day).padStart(2,'0'),
                type: 'expense', category: exp.category, amount: amount,
                accountId: exp.account, description: exp.desc, receipt: null,
                createdAt: new Date().toISOString()
            });
        });

        // Transfer to savings (most months)
        if (Math.random() > 0.3) {
            const transferAmt = randBetween(15000, 30000);
            const transferDay = randBetween(5, 10);
            const ts = Date.now() + id;
            transactions.push({
                id: 'trans_seed_' + (id++) + '_out',
                date: m.year + '-' + String(m.month).padStart(2,'0') + '-' + String(transferDay).padStart(2,'0'),
                type: 'expense', category: 'transfer', amount: transferAmt, accountId: 'acc_1',
                description: 'Transfer to Savings', receipt: null, isTransfer: true,
                createdAt: new Date().toISOString()
            });
            transactions.push({
                id: 'trans_seed_' + (id++) + '_in',
                date: m.year + '-' + String(m.month).padStart(2,'0') + '-' + String(transferDay).padStart(2,'0'),
                type: 'income', category: 'transfer', amount: transferAmt, accountId: 'acc_2',
                description: 'Transfer from Main Account', receipt: null, isTransfer: true,
                createdAt: new Date().toISOString()
            });
        }
    });

    // Calculate account balances from transactions
    transactions.forEach(t => {
        const acc = accounts.find(a => a.id === t.accountId);
        if (acc) {
            acc.balance += t.type === 'income' ? t.amount : -t.amount;
        }
    });

    const goals = [
        { id: 'goal_1', name: 'Emergency Fund', target: 500000, current: 185000, deadline: '2026-12-31', createdAt: '2025-10-15T00:00:00.000Z' },
        { id: 'goal_2', name: 'New Laptop', target: 350000, current: 120000, deadline: '2026-06-30', createdAt: '2025-11-01T00:00:00.000Z' },
        { id: 'goal_3', name: 'Vacation Trip', target: 200000, current: 45000, deadline: '2026-08-15', createdAt: '2026-01-10T00:00:00.000Z' }
    ];

    const upcomingExpenses = [
        { id: 'upc_1', name: 'Phone Bill', amount: 2500, category: 'utilities', dueDate: '2026-03-20', recurring: true, createdAt: '2025-10-01T00:00:00.000Z' },
        { id: 'upc_2', name: 'Car Insurance', amount: 35000, category: 'other_expense', dueDate: '2026-04-01', recurring: false, createdAt: '2026-01-15T00:00:00.000Z' },
        { id: 'upc_3', name: 'Gym Membership', amount: 5000, category: 'healthcare', dueDate: '2026-03-28', recurring: true, createdAt: '2025-12-01T00:00:00.000Z' },
        { id: 'upc_4', name: 'Domain Renewal', amount: 4500, category: 'subscription', dueDate: '2026-03-25', recurring: false, createdAt: '2026-02-20T00:00:00.000Z' }
    ];

    const budgets = [
        { id: 'budget_1', category: 'food', limit: 35000, createdAt: '2025-10-01T00:00:00.000Z' },
        { id: 'budget_2', category: 'transportation', limit: 15000, createdAt: '2025-10-01T00:00:00.000Z' },
        { id: 'budget_3', category: 'entertainment', limit: 5000, createdAt: '2025-11-01T00:00:00.000Z' },
        { id: 'budget_4', category: 'shopping', limit: 10000, createdAt: '2026-01-01T00:00:00.000Z' }
    ];

    const data = {
        transactions: transactions,
        accounts: accounts,
        goals: goals,
        upcomingExpenses: upcomingExpenses,
        budgets: budgets,
        customCategories: { income: [], expense: [] },
        currency: 'LKR',
        settings: { defaultAccount: 'acc_1', reminderDays: 3 }
    };

    localStorage.setItem('financeTrackerData', JSON.stringify(data));
    console.log('Seed data loaded!');
    console.log('Accounts:', accounts.length);
    console.log('Transactions:', transactions.length);
    console.log('Goals:', goals.length);
    console.log('Upcoming Expenses:', upcomingExpenses.length);
    console.log('Budgets:', budgets.length);
    console.log('');
    accounts.forEach(a => console.log('  ' + a.name + ': Rs.' + a.balance.toLocaleString()));
    console.log('');
    console.log('Refresh the page to see the data!');
})();
