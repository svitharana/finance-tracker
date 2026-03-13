// Finance Tracker Application
// All data is stored locally using LocalStorage

class FinanceTracker {
    constructor() {
        this.transactions = [];
        this.accounts = [];
        this.cards = [];
        this.goals = [];
        this.upcomingExpenses = [];
        this.currency = 'LKR';
        this.darkMode = false;
        this.dailyLimitUser = 0; // User-set daily limit
        this.editingTransactionId = null; // Track which transaction is being edited
        this.exchangeRates = {
            LKR: 1,
            USD: 0.003,
            EUR: 0.0026,
            GBP: 0.0023,
            INR: 0.25,
            JPY: 0.45,
            AUD: 0.0045,
            CAD: 0.004,
            AED: 0.011,
            SAR: 0.012
        };
        this.currentPage = 'home';
        this.charts = {};
        this.baseCurrency = 'LKR'; // All amounts stored in LKR

        this.init();
    }

    // Initialize the app
    init() {
        this.loadFromStorage();
        this.setupEventListeners();
        this.setDefaultDate();
        this.loadDarkMode();
        this.updateUI();
    }

    // Convert amount from base currency (LKR) to selected currency
    convertAmount(amountInLKR) {
        if (this.currency === this.baseCurrency) {
            return amountInLKR;
        }
        // Convert from LKR to target currency
        const rate = this.exchangeRates[this.currency] || 1;
        return amountInLKR * rate;
    }

    // Load data from localStorage
    loadFromStorage() {
        const stored = localStorage.getItem('financeTrackerData');
        if (stored) {
            const data = JSON.parse(stored);
            this.transactions = data.transactions || [];
            this.accounts = data.accounts || [];
            this.cards = data.cards || [];
            this.goals = data.goals || [];
            this.upcomingExpenses = data.upcomingExpenses || [];
            this.currency = data.currency || 'LKR';
            this.dailyLimitUser = data.dailyLimitUser || 0;
        } else {
            this.createDefaultAccount();
            this.currency = 'LKR';
            this.dailyLimitUser = 0;
        }
        
        // Sync currency selector with loaded value
        const currencySelect = document.getElementById('currencySelect');
        if (currencySelect) {
            currencySelect.value = this.currency;
        }
    }

    // Save data to localStorage
    saveToStorage() {
        const data = {
            transactions: this.transactions,
            accounts: this.accounts,
            cards: this.cards,
            goals: this.goals,
            upcomingExpenses: this.upcomingExpenses,
            currency: this.currency,
            dailyLimitUser: this.dailyLimitUser
        };
        localStorage.setItem('financeTrackerData', JSON.stringify(data));
    }

    // Create default account for new users
    createDefaultAccount() {
        const defaultAccount = {
            id: 'acc_' + Date.now(),
            name: 'Main Account',
            type: 'checking',
            balance: 0,
            createdAt: new Date().toISOString()
        };
        this.accounts.push(defaultAccount);
        this.saveToStorage();
    }

    // Setup Event Listeners
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => this.handleNavigation(e));
        });

        // Menu toggle for mobile
        document.getElementById('menuToggle').addEventListener('click', () => {
            document.querySelector('.nav-menu').classList.toggle('active');
        });

        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleDarkMode();
        });

        // Currency selector
        document.getElementById('currencySelect').addEventListener('change', (e) => {
            this.currency = e.target.value;
            this.saveToStorage();
            this.updateUI();
        });

        // Add transaction button (opens modal)
        document.getElementById('addTransactionBtn').addEventListener('click', () => {
            this.openTransactionModal();
        });

        // Transaction form
        document.getElementById('transactionForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTransaction();
        });

        // Transaction sorting and filtering
        document.getElementById('searchTransactions').addEventListener('input', () => {
            this.renderTransactions();
        });

        document.getElementById('sortBy').addEventListener('change', () => {
            this.renderTransactions();
        });

        // Goals and upcoming expenses
        document.getElementById('addGoalBtn')?.addEventListener('click', () => {
            this.openGoalModal();
        });

        document.getElementById('addUpcomingBtn')?.addEventListener('click', () => {
            this.openUpcomingModal();
        });

        // Sidebar goals and upcoming buttons
        document.getElementById('addGoalBtnSidebar')?.addEventListener('click', () => {
            this.openGoalModal();
        });

        document.getElementById('addUpcomingBtnSidebar')?.addEventListener('click', () => {
            this.openUpcomingModal();
        });

        // Accounts and Cards
        document.getElementById('addAccountBtn').addEventListener('click', () => {
            this.openAccountModal();
        });

        document.getElementById('addCardBtn').addEventListener('click', () => {
            this.openCardModal();
        });

        // Modal forms
        document.getElementById('goalForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveGoal();
        });

        document.getElementById('upcomingForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveUpcomingExpense();
        });

        document.getElementById('accountForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveAccount();
        });

        document.getElementById('cardForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveCard();
        });

        // Modal close buttons
        document.querySelectorAll('.modal-close, .modal-close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.closeModal(e));
        });

        // Close modal on background click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });

        // Summary page
        document.getElementById('summaryMonth').addEventListener('change', () => {
            this.renderCharts();
        });
    }

    // Navigation handling
    handleNavigation(e) {
        e.preventDefault();
        const page = e.currentTarget.getAttribute('data-page');
        this.currentPage = page;

        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        e.currentTarget.classList.add('active');

        // Hide all pages
        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
        });

        // Show selected page
        document.getElementById(page).classList.add('active');

        // Update page title
        const titles = {
            home: 'Home',
            transactions: 'All Transactions',
            accounts: 'Accounts & Cards',
            summary: 'Summary & Analytics'
        };
        document.getElementById('pageTitle').textContent = titles[page];

        // Close sidebar on mobile
        document.querySelector('.nav-menu').classList.remove('active');

        // Render page-specific content
        if (page === 'transactions') {
            this.renderTransactions();
        } else if (page === 'accounts') {
            this.renderAccounts();
            this.renderCards();
        } else if (page === 'summary') {
            this.renderCharts();
        }
    }

    // Dark mode toggle
    toggleDarkMode() {
        this.darkMode = !this.darkMode;
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', this.darkMode);
        
        // Update icon
        const icon = document.getElementById('themeToggle').querySelector('i');
        if (this.darkMode) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        } else {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }

        // Re-render charts if they exist
        if (Object.keys(this.charts).length > 0) {
            setTimeout(() => this.renderCharts(), 100);
        }
    }

    loadDarkMode() {
        const saved = localStorage.getItem('darkMode');
        if (saved === 'true') {
            this.darkMode = true;
            document.body.classList.add('dark-mode');
            document.getElementById('themeToggle').querySelector('i').classList.replace('fa-moon', 'fa-sun');
        }
    }

    // Set current date in transaction form
    setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('transDate').value = today;
    }

    // Add transaction
    addTransaction() {
        const date = document.getElementById('transDate').value;
        const type = document.getElementById('transType').value;
        const category = document.getElementById('transCategory').value;
        const amount = parseFloat(document.getElementById('transAmount').value);
        const accountId = document.getElementById('transAccount').value;
        const cardId = document.getElementById('transCard').value || null;
        const description = document.getElementById('transDescription').value;

        if (!accountId) {
            this.showToast('Missing Information', 'Please select an account', 'warning');
            return;
        }

        // Check if we're editing an existing transaction
        if (this.editingTransactionId) {
            const existingTransaction = this.transactions.find(t => t.id === this.editingTransactionId);
            if (existingTransaction) {
                // Remove old balance impact
                this.updateAccountBalance(existingTransaction.accountId, existingTransaction.amount, 
                    existingTransaction.type === 'income' ? 'expense' : 'income');

                // Update transaction
                existingTransaction.date = date;
                existingTransaction.type = type;
                existingTransaction.category = category;
                existingTransaction.amount = amount;
                existingTransaction.accountId = accountId;
                existingTransaction.cardId = cardId;
                existingTransaction.description = description;

                // Apply new balance impact
                this.updateAccountBalance(accountId, amount, type);
                this.saveToStorage();
                this.updateUI();
                if (this.currentPage === 'transactions') {
                    this.renderTransactions();
                }
                this.resetTransactionForm();
                this.editingTransactionId = null;
                this.closeTransactionModal();
                this.showToast('Success', 'Transaction updated successfully! ✏️', 'success');
                return;
            }
        }

        // Create new transaction
        const transaction = {
            id: 'trans_' + Date.now(),
            date,
            type,
            category,
            amount,
            accountId,
            cardId,
            description,
            receipt: null,
            createdAt: new Date().toISOString()
        };

        // Handle receipt upload
        const receiptFile = document.getElementById('transReceipt').files[0];
        if (receiptFile) {
            const reader = new FileReader();
            reader.onload = (e) => {
                transaction.receipt = e.target.result;
                this.transactions.push(transaction);
                this.updateAccountBalance(accountId, amount, type);
                this.saveToStorage();
                this.updateUI();
                this.resetTransactionForm();
                this.closeTransactionModal();
                this.showToast('Success', `${type.charAt(0).toUpperCase() + type.slice(1)} added successfully! 💰`, 'success');
            };
            reader.readAsDataURL(receiptFile);
        } else {
            this.transactions.push(transaction);
            this.updateAccountBalance(accountId, amount, type);
            this.saveToStorage();
            this.updateUI();
            this.resetTransactionForm();
            this.closeTransactionModal();
            this.showToast('Success', `${type.charAt(0).toUpperCase() + type.slice(1)} added successfully! 💰`, 'success');
        }
    }

    // Open transaction modal
    openTransactionModal() {
        const modal = document.getElementById('transactionModal');
        const form = document.getElementById('transactionForm');
        const header = modal.querySelector('.modal-header h3');
        const submitBtn = document.getElementById('transSubmitBtn');
        
        form.reset();
        this.setDefaultDate();
        this.editingTransactionId = null;
        header.textContent = 'Add Transaction';
        submitBtn.textContent = 'Add Transaction';
        modal.classList.add('active');
    }

    // Close transaction modal
    closeTransactionModal() {
        const modal = document.getElementById('transactionModal');
        modal.classList.remove('active');
    }

    // Update account balance
    updateAccountBalance(accountId, amount, type) {
        const account = this.accounts.find(a => a.id === accountId);
        if (account) {
            if (type === 'income') {
                account.balance += amount;
            } else {
                account.balance -= amount;
            }
        }
    }

    // Reset transaction form
    resetTransactionForm() {
        document.getElementById('transactionForm').reset();
        this.setDefaultDate();
    }

    // Calculate total balance
    getTotalBalance() {
        return this.accounts.reduce((sum, acc) => sum + acc.balance, 0);
    }

    // Get current month transactions
    getMonthlyTransactions(month = null) {
        const now = new Date();
        if (!month) {
            const year = now.getFullYear();
            const m = (now.getMonth() + 1).toString().padStart(2, '0');
            month = `${year}-${m}`;
        }

        return this.transactions.filter(t => t.date.startsWith(month));
    }

    // Get monthly income
    getMonthlyIncome() {
        const transactions = this.getMonthlyTransactions();
        return transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);
    }

    // Get monthly expenses
    getMonthlyExpenses() {
        const transactions = this.getMonthlyTransactions();
        return transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
    }

    // Get daily limit
    getDailyLimit() {
        // If user has set a daily limit, use that
        if (this.dailyLimitUser > 0) {
            return this.dailyLimitUser;
        }
        // Otherwise, calculate based on monthly expenses and days left
        const monthlyExpenses = this.getMonthlyExpenses();
        const today = new Date();
        const daysLeft = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() - today.getDate();
        return daysLeft > 0 ? monthlyExpenses / daysLeft : 0;
    }

    // Format currency
    formatCurrency(amount) {
        const symbols = {
            LKR: 'රු',
            USD: '$',
            EUR: '€',
            GBP: '£',
            INR: '₹',
            JPY: '¥',
            AUD: 'A$',
            CAD: 'C$',
            AED: 'د.إ',
            SAR: '﷼'
        };
        
        // Convert amount from LKR to selected currency
        const convertedAmount = this.convertAmount(amount);
        
        const symbol = symbols[this.currency] || '$';
        const absAmount = Math.abs(convertedAmount);
        const formatted = absAmount.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        return `${symbol}${formatted}`;
    }

    // Show toast notification
    showToast(title, message, type = 'success', duration = 4000) {
        const container = this.getOrCreateToastContainer();
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-times-circle',
            warning: 'fas fa-exclamation-circle',
            info: 'fas fa-info-circle'
        };
        
        toast.innerHTML = `
            <div class="toast-icon">
                <i class="${icons[type]}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
        `;
        
        container.appendChild(toast);
        
        // Auto-remove after duration
        setTimeout(() => {
            toast.classList.add('removing');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    // Get or create toast container
    getOrCreateToastContainer() {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        return container;
    }

    // Update UI - Home page
    updateUI() {
        // Sync currency selector
        const currencySelect = document.getElementById('currencySelect');
        if (currencySelect) {
            currencySelect.value = this.currency;
        }
        
        // Update stats
        document.getElementById('totalBalance').textContent = this.formatCurrency(this.getTotalBalance());
        document.getElementById('monthlyIncome').textContent = this.formatCurrency(this.getMonthlyIncome());
        document.getElementById('monthlyExpense').textContent = this.formatCurrency(this.getMonthlyExpenses());
        document.getElementById('dailyLimit').textContent = this.formatCurrency(this.getDailyLimit());

        // Update account selector in transaction form
        this.updateAccountSelectors();

        // Update goals
        this.renderGoals();
        this.renderHomeGoals();

        // Update upcoming expenses
        this.renderUpcomingExpenses();
        this.renderHomeUpcoming();

        // Update recent transactions
        this.renderRecentTransactions();
    }

    updateAccountSelectors() {
        const selects = ['transAccount', 'transCard'];
        
        const accountSelect = document.getElementById('transAccount');
        accountSelect.innerHTML = '<option value="">Select Account</option>';
        this.accounts.forEach(account => {
            const option = document.createElement('option');
            option.value = account.id;
            option.textContent = `${account.name} (${this.formatCurrency(account.balance)})`;
            accountSelect.appendChild(option);
        });

        const cardSelect = document.getElementById('transCard');
        cardSelect.innerHTML = '<option value="">None</option>';
        this.cards.forEach(card => {
            const option = document.createElement('option');
            option.value = card.id;
            option.textContent = `${card.name} (${card.type})`;
            cardSelect.appendChild(option);
        });
    }

    // Render transactions
    renderTransactions() {
        const searchTerm = document.getElementById('searchTransactions').value.toLowerCase();
        const sortBy = document.getElementById('sortBy').value;

        let filtered = this.transactions.filter(t => {
            const matchesSearch = t.description.toLowerCase().includes(searchTerm) ||
                                t.category.toLowerCase().includes(searchTerm);
            return matchesSearch;
        });

        // Sort transactions
        filtered.sort((a, b) => {
            switch(sortBy) {
                case 'date-asc':
                    return new Date(a.date) - new Date(b.date);
                case 'amount-desc':
                    return b.amount - a.amount;
                case 'amount-asc':
                    return a.amount - b.amount;
                case 'date-desc':
                default:
                    return new Date(b.date) - new Date(a.date);
            }
        });

        const incomeList = document.getElementById('incomeList');
        const expenseList = document.getElementById('expenseList');
        
        incomeList.innerHTML = '';
        expenseList.innerHTML = '';

        filtered.forEach(transaction => {
            const item = this.createTransactionElement(transaction);
            if (transaction.type === 'income') {
                incomeList.appendChild(item);
            } else {
                expenseList.appendChild(item);
            }
        });

        // Show empty state if no transactions
        if (filtered.length === 0) {
            const emptyMsg = document.createElement('p');
            emptyMsg.className = 'text-muted text-center';
            emptyMsg.textContent = 'No transactions found';
            incomeList.appendChild(emptyMsg);
        }
    }

    // Create transaction element
    createTransactionElement(transaction) {
        const div = document.createElement('div');
        div.className = `transaction-item ${transaction.type}`;
        
        const date = new Date(transaction.date).toLocaleDateString();
        const categoryLabel = this.getCategoryLabel(transaction.category);

        div.innerHTML = `
            <div class="transaction-info">
                <div class="transaction-category">${categoryLabel}</div>
                <div class="transaction-description">${transaction.description || 'No description'}</div>
                <div class="transaction-date">${date}</div>
            </div>
            <div class="transaction-amount">${this.formatCurrency(transaction.amount)}</div>
            <div class="transaction-actions">
                ${transaction.receipt ? `<button class="btn-action receipt" title="View receipt" onclick="tracker.viewReceipt('${transaction.id}')">
                    <i class="fas fa-image"></i>
                </button>` : ''}
                <button class="btn-action edit" title="Edit" onclick="tracker.openEditTransaction('${transaction.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-action delete" title="Delete" onclick="tracker.deleteTransaction('${transaction.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        return div;
    }

    // View receipt
    viewReceipt(transactionId) {
        const transaction = this.transactions.find(t => t.id === transactionId);
        if (transaction && transaction.receipt) {
            const modal = document.getElementById('receiptModal');
            const receiptImage = document.getElementById('receiptImage');
            const receiptInfo = document.getElementById('receiptInfo');
            
            receiptImage.src = transaction.receipt;
            
            const date = new Date(transaction.date).toLocaleDateString();
            
            receiptInfo.innerHTML = `
                <div class="receipt-info-row">
                    <span class="receipt-info-label">Date:</span>
                    <span>${date}</span>
                </div>
                <div class="receipt-info-row">
                    <span class="receipt-info-label">Amount:</span>
                    <span>${this.formatCurrency(transaction.amount)}</span>
                </div>
                <div class="receipt-info-row">
                    <span class="receipt-info-label">Category:</span>
                    <span>${this.getCategoryLabel(transaction.category)}</span>
                </div>
                <div class="receipt-info-row">
                    <span class="receipt-info-label">Description:</span>
                    <span>${transaction.description || 'N/A'}</span>
                </div>
            `;
            
            modal.classList.add('active');
        }
    }

    // Get category label
    getCategoryLabel(category) {
        const labels = {
            salary: 'Salary',
            freelance: 'Freelance',
            investment: 'Investment',
            bonus: 'Bonus',
            other_income: 'Other Income',
            food: 'Food & Dining',
            transportation: 'Transportation',
            utilities: 'Utilities',
            entertainment: 'Entertainment',
            shopping: 'Shopping',
            healthcare: 'Healthcare',
            rent: 'Rent',
            education: 'Education',
            subscription: 'Subscription',
            other_expense: 'Other Expense'
        };
        return labels[category] || category;
    }

    // Delete transaction
    deleteTransaction(id) {
        if (confirm('Are you sure? This action cannot be undone.')) {
            const transaction = this.transactions.find(t => t.id === id);
            if (transaction) {
                this.updateAccountBalance(transaction.accountId, transaction.amount, 
                    transaction.type === 'income' ? 'expense' : 'income');
                this.transactions = this.transactions.filter(t => t.id !== id);
                this.saveToStorage();
                this.updateUI();
                if (this.currentPage === 'transactions') {
                    this.renderTransactions();
                }
            }
        }
    }

    // Render goals
    renderGoals() {
        const goalsList = document.getElementById('goalsList');
        const goalsListSidebar = document.getElementById('goalsListSidebar');
        
        // Render in main content (if exists)
        if (goalsList) {
            goalsList.innerHTML = '';

            if (this.goals.length === 0) {
                goalsList.innerHTML = '<p class="text-muted">No savings goals yet</p>';
            } else {
                this.goals.forEach(goal => {
                    const progress = (goal.current / goal.target) * 100;
                    const daysLeft = Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24));

                    const item = document.createElement('div');
                    item.className = 'goal-item';
                    item.innerHTML = `
                        <div class="goal-info">
                            <div class="goal-name">${goal.name}</div>
                            <div class="goal-progress">
                                <div class="goal-progress-bar" style="width: ${Math.min(progress, 100)}%"></div>
                            </div>
                            <div class="goal-stats">
                                <div class="goal-stat">
                                    <span>${this.formatCurrency(goal.current)} / ${this.formatCurrency(goal.target)}</span>
                                </div>
                                <div class="goal-stat">
                                    <span>${daysLeft} days left</span>
                                </div>
                            </div>
                        </div>
                        <div class="transaction-actions">
                            <button class="btn-action edit" title="Edit" onclick="tracker.editGoal('${goal.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-action delete" title="Delete" onclick="tracker.deleteGoal('${goal.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `;
                    goalsList.appendChild(item);
                });
            }
        }

        // Render in sidebar
        if (goalsListSidebar) {
            goalsListSidebar.innerHTML = '';

            if (this.goals.length === 0) {
                goalsListSidebar.innerHTML = '<p class="text-muted" style="font-size: 12px;">No goals yet</p>';
            } else {
                this.goals.forEach(goal => {
                    const progress = (goal.current / goal.target) * 100;
                    const item = document.createElement('div');
                    item.className = 'sidebar-goal-item';
                    item.innerHTML = `
                        <div class="sidebar-item-name">${goal.name}</div>
                        <div class="sidebar-item-info">${this.formatCurrency(goal.current)} / ${this.formatCurrency(goal.target)}</div>
                    `;
                    item.addEventListener('click', () => this.editGoal(goal.id));
                    goalsListSidebar.appendChild(item);
                });
            }
        }
    }

    // Open goal modal
    openGoalModal(goalId = null) {
        const modal = document.getElementById('goalModal');
        const form = document.getElementById('goalForm');

        if (goalId) {
            const goal = this.goals.find(g => g.id === goalId);
            if (goal) {
                document.getElementById('goalName').value = goal.name;
                document.getElementById('goalTarget').value = goal.target;
                document.getElementById('goalCurrent').value = goal.current;
                document.getElementById('goalDeadline').value = goal.deadline;
                form.dataset.goalId = goalId;
            }
        } else {
            form.reset();
            delete form.dataset.goalId;
        }

        modal.classList.add('active');
    }

    editGoal(id) {
        this.openGoalModal(id);
    }

    // Save goal
    saveGoal() {
        const form = document.getElementById('goalForm');
        const goalId = form.dataset.goalId;
        
        const goal = {
            id: goalId || 'goal_' + Date.now(),
            name: document.getElementById('goalName').value,
            target: parseFloat(document.getElementById('goalTarget').value),
            current: parseFloat(document.getElementById('goalCurrent').value),
            deadline: document.getElementById('goalDeadline').value,
            createdAt: goalId ? this.goals.find(g => g.id === goalId).createdAt : new Date().toISOString()
        };

        if (goalId) {
            const index = this.goals.findIndex(g => g.id === goalId);
            this.goals[index] = goal;
            this.showToast('Updated', 'Savings goal updated successfully! 🎯', 'success');
        } else {
            this.goals.push(goal);
            this.showToast('Success', 'Savings goal created successfully! 🎯', 'success');
        }

        this.saveToStorage();
        this.updateUI();
        this.closeModalByElement(form);
    }

    // Delete goal
    deleteGoal(id) {
        if (confirm('Delete this goal?')) {
            this.goals = this.goals.filter(g => g.id !== id);
            this.saveToStorage();
            this.updateUI();
        }
    }

    // Render upcoming expenses
    renderUpcomingExpenses() {
        const upcomingList = document.getElementById('upcomingList');
        const upcomingListSidebar = document.getElementById('upcomingListSidebar');
        
        // Get upcoming expenses (today and onwards)
        const today = new Date();
        const upcoming = this.upcomingExpenses.filter(e => new Date(e.dueDate) >= today);
        upcoming.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

        // Render in main content (if exists)
        if (upcomingList) {
            upcomingList.innerHTML = '';

            if (upcoming.length === 0) {
                upcomingList.innerHTML = '<p class="text-muted">No upcoming expenses</p>';
            } else {
                upcoming.forEach(expense => {
                    const daysUntil = Math.ceil((new Date(expense.dueDate) - today) / (1000 * 60 * 60 * 24));
                    const item = document.createElement('div');
                    item.className = 'upcoming-item';
                    item.innerHTML = `
                        <div class="upcoming-info">
                            <div class="upcoming-name">${expense.name}</div>
                            <div class="upcoming-date">Due: ${new Date(expense.dueDate).toLocaleDateString()}</div>
                            <div class="upcoming-status">${daysUntil} days</div>
                        </div>
                        <div class="transaction-amount">${this.formatCurrency(expense.amount)}</div>
                        <div class="transaction-actions">
                            <button class="btn-action edit" title="Edit" onclick="tracker.editUpcoming('${expense.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-action delete" title="Delete" onclick="tracker.deleteUpcoming('${expense.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `;
                    upcomingList.appendChild(item);
                });
            }
        }

        // Render in sidebar
        if (upcomingListSidebar) {
            upcomingListSidebar.innerHTML = '';

            if (upcoming.length === 0) {
                upcomingListSidebar.innerHTML = '<p class="text-muted" style="font-size: 12px;">No upcoming</p>';
            } else {
                upcoming.slice(0, 5).forEach(expense => {
                    const daysUntil = Math.ceil((new Date(expense.dueDate) - today) / (1000 * 60 * 60 * 24));
                    const item = document.createElement('div');
                    item.className = 'sidebar-upcoming-item';
                    item.innerHTML = `
                        <div class="sidebar-item-name">${expense.name}</div>
                        <div class="sidebar-item-info">${daysUntil} days • ${this.formatCurrency(expense.amount)}</div>
                    `;
                    item.addEventListener('click', () => this.editUpcoming(expense.id));
                    upcomingListSidebar.appendChild(item);
                });
            }
        }
    }

    // Open upcoming modal
    openUpcomingModal(expenseId = null) {
        const modal = document.getElementById('upcomingModal');
        const form = document.getElementById('upcomingForm');

        if (expenseId) {
            const expense = this.upcomingExpenses.find(e => e.id === expenseId);
            if (expense) {
                document.getElementById('upcomingName').value = expense.name;
                document.getElementById('upcomingAmount').value = expense.amount;
                document.getElementById('upcomingCategory').value = expense.category;
                document.getElementById('upcomingDate').value = expense.dueDate;
                document.getElementById('upcomingRecurring').checked = expense.recurring;
                form.dataset.expenseId = expenseId;
            }
        } else {
            form.reset();
            delete form.dataset.expenseId;
        }

        modal.classList.add('active');
    }

    editUpcoming(id) {
        this.openUpcomingModal(id);
    }

    // Save upcoming expense
    saveUpcomingExpense() {
        const form = document.getElementById('upcomingForm');
        const expenseId = form.dataset.expenseId;

        const expense = {
            id: expenseId || 'upc_' + Date.now(),
            name: document.getElementById('upcomingName').value,
            amount: parseFloat(document.getElementById('upcomingAmount').value),
            category: document.getElementById('upcomingCategory').value,
            dueDate: document.getElementById('upcomingDate').value,
            recurring: document.getElementById('upcomingRecurring').checked,
            createdAt: expenseId ? this.upcomingExpenses.find(e => e.id === expenseId).createdAt : new Date().toISOString()
        };

        if (expenseId) {
            const index = this.upcomingExpenses.findIndex(e => e.id === expenseId);
            this.upcomingExpenses[index] = expense;
            this.showToast('Updated', 'Upcoming expense updated successfully! 📅', 'success');
        } else {
            this.upcomingExpenses.push(expense);
            this.showToast('Success', 'Upcoming expense added successfully! 📅', 'success');
        }

        this.saveToStorage();
        this.updateUI();
        this.closeModalByElement(form);
    }

    // Delete upcoming expense
    deleteUpcoming(id) {
        if (confirm('Delete this expense?')) {
            this.upcomingExpenses = this.upcomingExpenses.filter(e => e.id !== id);
            this.saveToStorage();
            this.updateUI();
        }
    }

    // Render recent transactions
    renderRecentTransactions() {
        const recentList = document.getElementById('recentTransactions');
        recentList.innerHTML = '';

        const recent = this.transactions.slice(-5).reverse();

        if (recent.length === 0) {
            recentList.innerHTML = '<p class="text-muted">No transactions yet</p>';
            return;
        }

        recent.forEach(transaction => {
            recentList.appendChild(this.createTransactionElement(transaction));
        });
    }

    // Render goals in home page (progress only, no edit/delete)
    renderHomeGoals() {
        const goalsList = document.getElementById('goalsListHome');
        if (!goalsList) return;
        
        goalsList.innerHTML = '';

        if (this.goals.length === 0) {
            goalsList.innerHTML = '<p class="text-muted">No savings goals yet</p>';
        } else {
            this.goals.forEach(goal => {
                const progress = (goal.current / goal.target) * 100;
                const daysLeft = Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24));

                const item = document.createElement('div');
                item.className = 'goal-item-home';
                item.innerHTML = `
                    <div class="goal-info">
                        <div class="goal-name">${goal.name}</div>
                        <div class="goal-progress">
                            <div class="goal-progress-bar" style="width: ${Math.min(progress, 100)}%"></div>
                        </div>
                        <div class="goal-stats">
                            <div class="goal-stat">
                                <span>${this.formatCurrency(goal.current)} / ${this.formatCurrency(goal.target)}</span>
                            </div>
                            <div class="goal-stat">
                                <span>${daysLeft} days left</span>
                            </div>
                        </div>
                    </div>
                    <div class="transaction-actions">
                        <button class="btn-action edit" title="Edit" onclick="tracker.editGoal('${goal.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-action delete" title="Delete" onclick="tracker.deleteGoal('${goal.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `;
                goalsList.appendChild(item);
            });
        }
    }

    // Render upcoming expenses in home page (progress only, no edit/delete)
    renderHomeUpcoming() {
        const upcomingList = document.getElementById('upcomingListHome');
        if (!upcomingList) return;
        
        upcomingList.innerHTML = '';
        
        // Get upcoming expenses (today and onwards)
        const today = new Date();
        const upcoming = this.upcomingExpenses.filter(e => new Date(e.dueDate) >= today);
        upcoming.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

        if (upcoming.length === 0) {
            upcomingList.innerHTML = '<p class="text-muted">No upcoming expenses</p>';
        } else {
            upcoming.forEach(expense => {
                const daysUntil = Math.ceil((new Date(expense.dueDate) - today) / (1000 * 60 * 60 * 24));
                const item = document.createElement('div');
                item.className = 'upcoming-item-home';
                item.innerHTML = `
                    <div class="upcoming-info">
                        <div class="upcoming-name">${expense.name}</div>
                        <div class="upcoming-date">Due: ${new Date(expense.dueDate).toLocaleDateString()}</div>
                        <div class="upcoming-status">${daysUntil} days</div>
                    </div>
                    <div class="upcoming-actions">
                        <div class="transaction-amount">${this.formatCurrency(expense.amount)}</div>
                        <div class="transaction-actions">
                            <button class="btn-action edit" title="Edit" onclick="tracker.editUpcoming('${expense.id}')">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-action delete" title="Delete" onclick="tracker.deleteUpcoming('${expense.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
                upcomingList.appendChild(item);
            });
        }
    }

    // Render accounts
    renderAccounts() {
        const accountsList = document.getElementById('accountsList');
        accountsList.innerHTML = '';

        if (this.accounts.length === 0) {
            accountsList.innerHTML = '<p class="text-muted">No accounts yet</p>';
            return;
        }

        this.accounts.forEach(account => {
            const item = document.createElement('div');
            item.className = 'account-card';
            item.innerHTML = `
                <div class="account-type">${this.getAccountTypeLabel(account.type)}</div>
                <div class="account-name">${account.name}</div>
                <div class="account-balance">${this.formatCurrency(account.balance)}</div>
                <div class="account-footer">
                    <button class="btn-action edit" title="Edit" onclick="tracker.editAccount('${account.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action delete" title="Delete" onclick="tracker.deleteAccount('${account.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            accountsList.appendChild(item);
        });
    }

    getAccountTypeLabel(type) {
        const labels = {
            checking: 'Checking',
            savings: 'Savings',
            investment: 'Investment',
            crypto: 'Crypto',
            other: 'Other'
        };
        return labels[type] || type;
    }

    // Open account modal
    openAccountModal(accountId = null) {
        const modal = document.getElementById('accountModal');
        const form = document.getElementById('accountForm');

        if (accountId) {
            const account = this.accounts.find(a => a.id === accountId);
            if (account) {
                document.getElementById('accountName').value = account.name;
                document.getElementById('accountType').value = account.type;
                document.getElementById('accountBalance').value = account.balance;
                document.getElementById('accountDailyLimit').value = this.dailyLimitUser;
                form.dataset.accountId = accountId;
            }
        } else {
            form.reset();
            delete form.dataset.accountId;
        }

        modal.classList.add('active');
    }

    editAccount(id) {
        this.openAccountModal(id);
    }

    // Save account
    saveAccount() {
        const form = document.getElementById('accountForm');
        const accountId = form.dataset.accountId;

        const account = {
            id: accountId || 'acc_' + Date.now(),
            name: document.getElementById('accountName').value,
            type: document.getElementById('accountType').value,
            balance: parseFloat(document.getElementById('accountBalance').value),
            createdAt: accountId ? this.accounts.find(a => a.id === accountId).createdAt : new Date().toISOString()
        };

        // Handle daily limit if provided (can be updated on both create and edit)
        const dailyLimitInput = parseFloat(document.getElementById('accountDailyLimit').value) || 0;
        if (dailyLimitInput > 0) {
            this.dailyLimitUser = dailyLimitInput;
        }

        if (accountId) {
            const index = this.accounts.findIndex(a => a.id === accountId);
            this.accounts[index] = account;
            this.showToast('Updated', 'Account updated successfully! 🏦', 'success');
        } else {
            this.accounts.push(account);
            this.showToast('Success', 'Account created successfully! 🏦', 'success');
        }

        this.saveToStorage();
        this.updateUI();
        this.closeModalByElement(form);
    }

    // Delete account
    deleteAccount(id) {
        if (this.accounts.length === 1) {
            alert('You must have at least one account');
            return;
        }

        if (confirm('Delete this account? Associated transactions will remain.')) {
            this.accounts = this.accounts.filter(a => a.id !== id);
            this.saveToStorage();
            this.updateUI();
            this.renderAccounts();
        }
    }

    // Render cards
    renderCards() {
        const cardsList = document.getElementById('cardsList');
        cardsList.innerHTML = '';

        if (this.cards.length === 0) {
            cardsList.innerHTML = '<p class="text-muted">No cards yet</p>';
            return;
        }

        this.cards.forEach(card => {
            const item = document.createElement('div');
            item.className = 'payment-card';
            item.innerHTML = `
                <div class="card-type">${card.type.toUpperCase()}</div>
                <div class="card-name">${card.name}</div>
                <div class="card-number">•••• ${card.number}</div>
                <div class="card-limit">Limit: ${this.formatCurrency(card.limit)}</div>
                <div class="card-footer">
                    <button class="btn-action edit" title="Edit" onclick="tracker.editCard('${card.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action delete" title="Delete" onclick="tracker.deleteCard('${card.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            cardsList.appendChild(item);
        });
    }

    // Open card modal
    openCardModal(cardId = null) {
        const modal = document.getElementById('cardModal');
        const form = document.getElementById('cardForm');

        if (cardId) {
            const card = this.cards.find(c => c.id === cardId);
            if (card) {
                document.getElementById('cardName').value = card.name;
                document.getElementById('cardType').value = card.type;
                document.getElementById('cardNumber').value = card.number;
                document.getElementById('cardLimit').value = card.limit;
                form.dataset.cardId = cardId;
            }
        } else {
            form.reset();
            delete form.dataset.cardId;
        }

        modal.classList.add('active');
    }

    editCard(id) {
        this.openCardModal(id);
    }

    // Save card
    saveCard() {
        const form = document.getElementById('cardForm');
        const cardId = form.dataset.cardId;

        const card = {
            id: cardId || 'card_' + Date.now(),
            name: document.getElementById('cardName').value,
            type: document.getElementById('cardType').value,
            number: document.getElementById('cardNumber').value,
            limit: parseFloat(document.getElementById('cardLimit').value),
            createdAt: cardId ? this.cards.find(c => c.id === cardId).createdAt : new Date().toISOString()
        };

        if (cardId) {
            const index = this.cards.findIndex(c => c.id === cardId);
            this.cards[index] = card;
            this.showToast('Updated', 'Card updated successfully! 💳', 'success');
        } else {
            this.cards.push(card);
            this.showToast('Success', 'Card added successfully! 💳', 'success');
        }

        this.saveToStorage();
        this.updateUI();
        this.closeModalByElement(form);
    }

    // Delete card
    deleteCard(id) {
        if (confirm('Delete this card?')) {
            this.cards = this.cards.filter(c => c.id !== id);
            this.saveToStorage();
            this.updateUI();
            this.renderCards();
        }
    }

    // Render charts
    renderCharts() {
        const monthInput = document.getElementById('summaryMonth').value;
        let month = monthInput;

        if (!month) {
            const now = new Date();
            const year = now.getFullYear();
            const m = (now.getMonth() + 1).toString().padStart(2, '0');
            month = `${year}-${m}`;
            document.getElementById('summaryMonth').value = month;
        }

        const monthlyTransactions = this.getMonthlyTransactions(month);
        const income = monthlyTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
        const expense = monthlyTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

        // Update summary
        document.getElementById('summaryIncome').textContent = this.formatCurrency(income);
        document.getElementById('summaryExpense').textContent = this.formatCurrency(expense);
        document.getElementById('summaryNet').textContent = this.formatCurrency(income - expense);

        // Find top category
        const categoryTotals = {};
        monthlyTransactions.forEach(t => {
            categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
        });
        const topCat = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
        document.getElementById('topCategory').textContent = topCat ? this.getCategoryLabel(topCat[0]) : '-';

        // Destroy existing charts
        Object.values(this.charts).forEach(chart => chart.destroy());
        this.charts = {};

        // Overview Chart
        const overviewCtx = document.getElementById('overviewChart').getContext('2d');
        this.charts.overview = new Chart(overviewCtx, {
            type: 'bar',
            data: {
                labels: ['Income', 'Expenses'],
                datasets: [{
                    label: 'Amount',
                    data: [income, expense],
                    backgroundColor: ['#10b981', '#ef4444'],
                    borderRadius: 8,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => this.formatCurrency(value)
                        }
                    }
                }
            }
        });

        // Category Chart
        const expensesByCategory = {};
        monthlyTransactions
            .filter(t => t.type === 'expense')
            .forEach(t => {
                expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
            });

        const categoryLabels = Object.keys(expensesByCategory).map(cat => this.getCategoryLabel(cat));
        const categoryData = Object.values(expensesByCategory);

        const categoryCtx = document.getElementById('categoryChart').getContext('2d');
        this.charts.category = new Chart(categoryCtx, {
            type: 'doughnut',
            data: {
                labels: categoryLabels,
                datasets: [{
                    data: categoryData,
                    backgroundColor: [
                        '#6366f1',
                        '#ec4899',
                        '#f59e0b',
                        '#10b981',
                        '#0ea5e9',
                        '#8b5cf6',
                        '#ef4444',
                        '#f97316'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });

        // Income Chart
        const incomeByCategory = {};
        monthlyTransactions
            .filter(t => t.type === 'income')
            .forEach(t => {
                incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + t.amount;
            });

        const incomeLabels = Object.keys(incomeByCategory).map(cat => this.getCategoryLabel(cat));
        const incomeData = Object.values(incomeByCategory);

        const incomeCtx = document.getElementById('incomeChart').getContext('2d');
        this.charts.income = new Chart(incomeCtx, {
            type: 'pie',
            data: {
                labels: incomeLabels,
                datasets: [{
                    data: incomeData,
                    backgroundColor: [
                        '#6366f1',
                        '#ec4899',
                        '#f59e0b',
                        '#10b981',
                        '#0ea5e9'
                    ]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });

        // Account Distribution
        const accountCtx = document.getElementById('accountChart').getContext('2d');
        const accountLabels = this.accounts.map(a => a.name);
        const accountData = this.accounts.map(a => a.balance);

        this.charts.account = new Chart(accountCtx, {
            type: 'bar',
            data: {
                labels: accountLabels,
                datasets: [{
                    label: 'Balance',
                    data: accountData,
                    backgroundColor: '#6366f1',
                    borderRadius: 8,
                    borderSkipped: false
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => this.formatCurrency(value)
                        }
                    }
                }
            }
        });
    }

    // Modal management
    closeModal(e) {
        if (e.target.classList.contains('modal-close') || 
            e.target.classList.contains('modal-close-btn')) {
            const modal = e.target.closest('.modal');
            if (modal) {
                modal.classList.remove('active');
            }
        }
    }

    closeModalByElement(element) {
        const modal = element.closest('.modal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    // Currency converter (for currency calculator)
    convertCurrency(fromCurrency, toCurrency, amount) {
        // Convert from fromCurrency to LKR first
        const baseCurrencyRate = this.exchangeRates[fromCurrency] || 1;
        const amountInLKR = amount / baseCurrencyRate;
        
        // Then convert from LKR to toCurrency
        const toRate = this.exchangeRates[toCurrency] || 1;
        return amountInLKR * toRate;
    }

    openEditTransaction(id) {
        const transaction = this.transactions.find(t => t.id === id);
        if (transaction) {
            const modal = document.getElementById('transactionModal');
            const header = modal.querySelector('.modal-header h3');
            const submitBtn = document.getElementById('transSubmitBtn');
            
            // Populate form with transaction data
            document.getElementById('transDate').value = transaction.date;
            document.getElementById('transType').value = transaction.type;
            document.getElementById('transCategory').value = transaction.category;
            document.getElementById('transAmount').value = transaction.amount;
            document.getElementById('transAccount').value = transaction.accountId;
            document.getElementById('transCard').value = transaction.cardId || '';
            document.getElementById('transDescription').value = transaction.description;
            
            // Mark as editing and update modal header and button
            this.editingTransactionId = id;
            header.textContent = 'Edit Transaction';
            submitBtn.textContent = 'Update Transaction';
            
            // Open modal and focus on amount field
            modal.classList.add('active');
            document.getElementById('transAmount').focus();
        }
    }
}

// Initialize the app when DOM is ready
let tracker;
document.addEventListener('DOMContentLoaded', () => {
    tracker = new FinanceTracker();
});
