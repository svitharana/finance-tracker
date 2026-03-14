// Finance Tracker Application
// All data is stored locally using LocalStorage

class FinanceTracker {
    constructor() {
        this.transactions = [];
        this.accounts = [];
        this.goals = [];
        this.upcomingExpenses = [];
        this.budgets = [];
        this.customCategories = { income: [], expense: [] };
        this.currency = 'LKR';
        this.darkMode = false;
        this.editingTransactionId = null;
        this.reminderDismissed = false;
        this.settings = { defaultAccount: '', reminderDays: 3 };
        this.exchangeRates = {
            LKR: 1, USD: 0.003, EUR: 0.0026, GBP: 0.0023, INR: 0.25,
            JPY: 0.45, AUD: 0.0045, CAD: 0.004, AED: 0.011, SAR: 0.012
        };
        this.defaultCategories = {
            income: [
                { id: 'salary', label: 'Salary' },
                { id: 'freelance', label: 'Freelance' },
                { id: 'investment', label: 'Investment' },
                { id: 'bonus', label: 'Bonus' },
                { id: 'other_income', label: 'Other' }
            ],
            expense: [
                { id: 'food', label: 'Food & Dining' },
                { id: 'transportation', label: 'Transportation' },
                { id: 'utilities', label: 'Utilities' },
                { id: 'entertainment', label: 'Entertainment' },
                { id: 'shopping', label: 'Shopping' },
                { id: 'healthcare', label: 'Healthcare' },
                { id: 'rent', label: 'Rent/Mortgage' },
                { id: 'education', label: 'Education' },
                { id: 'subscription', label: 'Subscription' },
                { id: 'savings', label: 'Savings/Goals' },
                { id: 'other_expense', label: 'Other' }
            ]
        };
        this.currentPage = 'home';
        this.charts = {};
        this.baseCurrency = 'LKR';
        this.init();
    }

    init() {
        this.loadFromStorage();
        this.processRecurringExpenses();
        this.setupEventListeners();
        this.setDefaultDate();
        this.loadDarkMode();
        this.updateCategorySelectors();
        this.updateUI();
    }

    // --- Data Storage ---

    convertAmount(amountInLKR) {
        if (this.currency === this.baseCurrency) return amountInLKR;
        return amountInLKR * (this.exchangeRates[this.currency] || 1);
    }

    loadFromStorage() {
        const stored = localStorage.getItem('financeTrackerData');
        if (stored) {
            const data = JSON.parse(stored);
            this.transactions = data.transactions || [];
            this.accounts = data.accounts || [];
            this.goals = data.goals || [];
            this.upcomingExpenses = data.upcomingExpenses || [];
            this.budgets = data.budgets || [];
            this.customCategories = data.customCategories || { income: [], expense: [] };
            this.currency = data.currency || 'LKR';
            this.settings = data.settings || { defaultAccount: '', reminderDays: 3 };
        } else {
            this.createDefaultAccount();
            this.currency = 'LKR';
        }
    }

    saveToStorage() {
        const data = {
            transactions: this.transactions,
            accounts: this.accounts,
            goals: this.goals,
            upcomingExpenses: this.upcomingExpenses,
            budgets: this.budgets,
            customCategories: this.customCategories,
            currency: this.currency,
            settings: this.settings
        };
        localStorage.setItem('financeTrackerData', JSON.stringify(data));
    }

    createDefaultAccount() {
        const id = 'acc_' + Date.now();
        this.accounts.push({
            id: id,
            name: 'Main Account',
            type: 'checking',
            balance: 0,
            createdAt: new Date().toISOString()
        });
        this.settings.defaultAccount = id;
        this.saveToStorage();
    }

    // --- Categories ---

    getAllCategories(type) {
        const defaults = this.defaultCategories[type] || [];
        const custom = (this.customCategories[type] || []).map(c => ({ id: c.id, label: c.label }));
        return [...defaults, ...custom];
    }

    getCategoryLabel(category) {
        if (category === 'transfer') return 'Transfer';
        const all = [...this.getAllCategories('income'), ...this.getAllCategories('expense')];
        const found = all.find(c => c.id === category);
        return found ? found.label : category;
    }

    updateCategorySelectors() {
        const transCategory = document.getElementById('transCategory');
        const transType = document.getElementById('transType');
        if (!transCategory) return;
        const currentVal = transCategory.value;
        const selectedType = transType ? transType.value : '';

        transCategory.innerHTML = '<option value="">Select Category</option>';

        if (!selectedType) {
            // No type selected — show disabled placeholder
            transCategory.disabled = true;
            transCategory.innerHTML = '<option value="">Select type first</option>';
        } else {
            transCategory.disabled = false;
            if (selectedType === 'income') {
                this.getAllCategories('income').forEach(cat => {
                    const opt = document.createElement('option');
                    opt.value = cat.id; opt.textContent = cat.label;
                    transCategory.appendChild(opt);
                });
            } else {
                this.getAllCategories('expense').forEach(cat => {
                    const opt = document.createElement('option');
                    opt.value = cat.id; opt.textContent = cat.label;
                    transCategory.appendChild(opt);
                });
            }
        }
        if (currentVal) transCategory.value = currentVal;

        const budgetCategory = document.getElementById('budgetCategory');
        if (budgetCategory) {
            const budgetVal = budgetCategory.value;
            budgetCategory.innerHTML = '<option value="">Select Category</option>';
            this.getAllCategories('expense').forEach(cat => {
                const opt = document.createElement('option');
                opt.value = cat.id; opt.textContent = cat.label;
                budgetCategory.appendChild(opt);
            });
            if (budgetVal) budgetCategory.value = budgetVal;
        }
    }

    addCustomCategory(type) {
        const inputId = type === 'income' ? 'newIncomeCategory' : 'newExpenseCategory';
        const input = document.getElementById(inputId);
        const name = input.value.trim();
        if (!name) return;
        const id = 'custom_' + name.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now();
        if (!this.customCategories[type]) this.customCategories[type] = [];
        this.customCategories[type].push({ id, label: name });
        this.saveToStorage();
        this.updateCategorySelectors();
        this.renderCategoriesModal();
        input.value = '';
        this.showToast('Success', 'Category "' + name + '" added', 'success');
    }

    deleteCustomCategory(type, id) {
        this.customCategories[type] = this.customCategories[type].filter(c => c.id !== id);
        this.saveToStorage();
        this.updateCategorySelectors();
        this.renderCategoriesModal();
    }

    renderCategoriesModal() {
        const incomeList = document.getElementById('incomeCategoriesList');
        const expenseList = document.getElementById('expenseCategoriesList');

        if (incomeList) {
            incomeList.innerHTML = '';
            this.defaultCategories.income.forEach(cat => {
                const div = document.createElement('div');
                div.className = 'category-tag';
                div.innerHTML = '<span>' + cat.label + '</span><small class="text-muted">default</small>';
                incomeList.appendChild(div);
            });
            (this.customCategories.income || []).forEach(cat => {
                const div = document.createElement('div');
                div.className = 'category-tag custom';
                div.innerHTML = '<span>' + cat.label + '</span><button class="btn-action delete" onclick="tracker.deleteCustomCategory(\'income\',\'' + cat.id + '\')"><i class="fas fa-times"></i></button>';
                incomeList.appendChild(div);
            });
        }

        if (expenseList) {
            expenseList.innerHTML = '';
            this.defaultCategories.expense.forEach(cat => {
                const div = document.createElement('div');
                div.className = 'category-tag';
                div.innerHTML = '<span>' + cat.label + '</span><small class="text-muted">default</small>';
                expenseList.appendChild(div);
            });
            (this.customCategories.expense || []).forEach(cat => {
                const div = document.createElement('div');
                div.className = 'category-tag custom';
                div.innerHTML = '<span>' + cat.label + '</span><button class="btn-action delete" onclick="tracker.deleteCustomCategory(\'expense\',\'' + cat.id + '\')"><i class="fas fa-times"></i></button>';
                expenseList.appendChild(div);
            });
        }
    }

    // --- Event Listeners ---

    setupEventListeners() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => this.handleNavigation(e));
        });
        document.getElementById('menuToggle').addEventListener('click', () => {
            document.querySelector('.nav-menu').classList.toggle('active');
        });
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleDarkMode());

        // Settings
        document.getElementById('settingsBtn').addEventListener('click', () => this.openSettingsModal());
        document.getElementById('settingsSaveBtn').addEventListener('click', () => this.saveSettings());
        document.getElementById('settingsThemeBtn').addEventListener('click', () => this.toggleDarkMode());
        document.getElementById('settingsResetBtn').addEventListener('click', () => { this.resetAllData(); document.getElementById('settingsModal').classList.remove('active'); });
        document.getElementById('reminderMinus').addEventListener('click', () => this.stepReminderDays(-1));
        document.getElementById('reminderPlus').addEventListener('click', () => this.stepReminderDays(1));

        // Popover
        document.getElementById('popoverCloseBtn').addEventListener('click', () => this.closePopover());
        document.getElementById('popoverCancelBtn').addEventListener('click', () => this.closePopover());
        document.getElementById('popoverConfirmBtn').addEventListener('click', () => this.confirmPopover());

        // Transactions
        document.getElementById('addTransactionBtn').addEventListener('click', () => this.openTransactionModal());
        document.getElementById('transactionForm').addEventListener('submit', (e) => { e.preventDefault(); this.addTransaction(); });
        document.getElementById('transType').addEventListener('change', () => this.updateCategorySelectors());
        document.getElementById('searchTransactions').addEventListener('input', () => this.renderTransactions());
        document.getElementById('sortBy').addEventListener('change', () => this.renderTransactions());

        // Transfer
        document.getElementById('transferBtn').addEventListener('click', () => this.openTransferModal());
        document.getElementById('transferForm').addEventListener('submit', (e) => { e.preventDefault(); this.executeTransfer(); });

        // Goals
        document.getElementById('addGoalBtnSidebar')?.addEventListener('click', () => this.openGoalModal());
        document.getElementById('addUpcomingBtnSidebar')?.addEventListener('click', () => this.openUpcomingModal());
        document.getElementById('addGoalBtnHome')?.addEventListener('click', () => this.openGoalModal());
        document.getElementById('addUpcomingBtnHome')?.addEventListener('click', () => this.openUpcomingModal());
        document.getElementById('goalForm').addEventListener('submit', (e) => { e.preventDefault(); this.saveGoal(); });
        document.getElementById('upcomingForm').addEventListener('submit', (e) => { e.preventDefault(); this.saveUpcomingExpense(); });

        // Accounts
        document.getElementById('addAccountBtn').addEventListener('click', () => this.openAccountModal());
        document.getElementById('accountForm').addEventListener('submit', (e) => { e.preventDefault(); this.saveAccount(); });

        // Budgets
        document.getElementById('addBudgetBtn').addEventListener('click', () => this.openBudgetModal());
        document.getElementById('budgetForm').addEventListener('submit', (e) => { e.preventDefault(); this.saveBudget(); });
        document.getElementById('manageCategoriesBtn').addEventListener('click', () => {
            this.renderCategoriesModal();
            document.getElementById('categoriesModal').classList.add('active');
        });

        // Backup / Export
        document.getElementById('backupBtn').addEventListener('click', () => this.exportBackup());
        document.getElementById('restoreBtn').addEventListener('click', () => document.getElementById('restoreFileInput').click());
        document.getElementById('restoreFileInput').addEventListener('change', (e) => this.importBackup(e));
        document.getElementById('exportCsvBtn').addEventListener('click', () => this.exportCSV());
        document.getElementById('resetAllBtn').addEventListener('click', () => this.resetAllData());

        // Modal close buttons
        document.querySelectorAll('.modal-close, .modal-close-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.closeModal(e));
        });
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.classList.remove('active');
            });
        });

        // Summary
        document.getElementById('summaryMonth').addEventListener('change', () => this.renderCharts());

        // File upload drag & drop
        const dropZone = document.getElementById('receiptDropZone');
        const fileInput = document.getElementById('transReceipt');
        if (dropZone && fileInput) {
            dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
            dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('drag-over');
                if (e.dataTransfer.files.length) {
                    fileInput.files = e.dataTransfer.files;
                    this.showReceiptPreview(e.dataTransfer.files[0]);
                }
            });
            fileInput.addEventListener('change', () => {
                if (fileInput.files[0]) this.showReceiptPreview(fileInput.files[0]);
            });
            document.getElementById('receiptRemoveBtn').addEventListener('click', (e) => {
                e.stopPropagation();
                fileInput.value = '';
                document.getElementById('receiptPreview').classList.add('hide');
                document.getElementById('receiptUploadContent').classList.remove('hide');
            });
        }
    }

    // --- Navigation ---

    handleNavigation(e) {
        e.preventDefault();
        const page = e.currentTarget.getAttribute('data-page');
        this.currentPage = page;
        document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
        e.currentTarget.classList.add('active');
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(page).classList.add('active');
        const titles = { home: 'Home', transactions: 'All Transactions', accounts: 'Accounts', budgets: 'Budgets', summary: 'Summary & Analytics' };
        document.getElementById('pageTitle').textContent = titles[page] || page;
        document.querySelector('.nav-menu').classList.remove('active');
        if (page === 'transactions') this.renderTransactions();
        else if (page === 'accounts') this.renderAccounts();
        else if (page === 'budgets') this.renderBudgets();
        else if (page === 'summary') this.renderCharts();
    }

    // --- Dark Mode ---

    toggleDarkMode() {
        this.darkMode = !this.darkMode;
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', this.darkMode);
        const icon = document.getElementById('themeToggle').querySelector('i');
        icon.classList.toggle('fa-moon', !this.darkMode);
        icon.classList.toggle('fa-sun', this.darkMode);
        const themeLabel = document.getElementById('settingsThemeLabel');
        if (themeLabel) themeLabel.textContent = this.darkMode ? 'Dark Mode' : 'Light Mode';
        const settingsThemeIcon = document.querySelector('#settingsThemeBtn i');
        if (settingsThemeIcon) settingsThemeIcon.className = this.darkMode ? 'fas fa-sun' : 'fas fa-moon';
        if (Object.keys(this.charts).length > 0) {
            setTimeout(() => this.renderCharts(), 100);
        }
    }

    loadDarkMode() {
        if (localStorage.getItem('darkMode') === 'true') {
            this.darkMode = true;
            document.body.classList.add('dark-mode');
            document.getElementById('themeToggle').querySelector('i').classList.replace('fa-moon', 'fa-sun');
        }
    }

    setDefaultDate() {
        document.getElementById('transDate').value = new Date().toISOString().split('T')[0];
    }

    // --- Settings ---

    openSettingsModal() {
        const modal = document.getElementById('settingsModal');
        document.getElementById('settingsCurrency').value = this.currency;
        document.getElementById('settingsReminderDays').textContent = this.settings.reminderDays || 3;
        document.getElementById('settingsThemeLabel').textContent = this.darkMode ? 'Dark Mode' : 'Light Mode';
        const themeIcon = document.getElementById('settingsThemeBtn').querySelector('i');
        themeIcon.className = this.darkMode ? 'fas fa-sun' : 'fas fa-moon';
        const accSelect = document.getElementById('settingsDefaultAccount');
        accSelect.innerHTML = '<option value="">None (always ask)</option>';
        this.accounts.forEach(acc => {
            const opt = document.createElement('option');
            opt.value = acc.id;
            opt.textContent = acc.name;
            accSelect.appendChild(opt);
        });
        accSelect.value = this.settings.defaultAccount || '';
        modal.classList.add('active');
    }

    saveSettings() {
        this.currency = document.getElementById('settingsCurrency').value;
        this.settings.defaultAccount = document.getElementById('settingsDefaultAccount').value;
        this.settings.reminderDays = parseInt(document.getElementById('settingsReminderDays').textContent) || 3;
        this.saveToStorage();
        this.updateUI();
        document.getElementById('settingsModal').classList.remove('active');
        this.showToast('Success', 'Settings saved!', 'success');
    }

    stepReminderDays(delta) {
        const el = document.getElementById('settingsReminderDays');
        let val = parseInt(el.textContent) || 3;
        val = Math.max(1, Math.min(30, val + delta));
        el.textContent = val;
    }

    // --- Transactions ---

    addTransaction() {
        const date = document.getElementById('transDate').value;
        const type = document.getElementById('transType').value;
        const category = document.getElementById('transCategory').value;
        const amount = parseFloat(document.getElementById('transAmount').value);
        const accountId = document.getElementById('transAccount').value;
        const description = document.getElementById('transDescription').value;

        if (!accountId) {
            this.showToast('Missing Information', 'Please select an account', 'warning');
            return;
        }
        if (!amount || amount <= 0) {
            this.showToast('Invalid Amount', 'Please enter an amount greater than zero', 'warning');
            return;
        }

        // Warn if expense exceeds account balance
        if (type === 'expense') {
            const account = this.accounts.find(a => a.id === accountId);
            if (account && amount > account.balance) {
                if (!this._overdraftConfirmed) {
                    this._overdraftConfirmed = true;
                    this.showToast('Low Balance', account.name + ' only has ' + this.formatCurrency(account.balance) + '. Submit again to confirm.', 'warning', 5000);
                    return;
                }
            }
        }
        this._overdraftConfirmed = false;

        if (this.editingTransactionId) {
            const existing = this.transactions.find(t => t.id === this.editingTransactionId);
            if (existing) {
                this.updateAccountBalance(existing.accountId, existing.amount, existing.type === 'income' ? 'expense' : 'income');
                existing.date = date; existing.type = type; existing.category = category;
                existing.amount = amount; existing.accountId = accountId; existing.description = description;
                this.updateAccountBalance(accountId, amount, type);
                this.saveToStorage(); this.updateUI();
                if (this.currentPage === 'transactions') this.renderTransactions();
                this.resetTransactionForm();
                this.editingTransactionId = null;
                this.closeTransactionModal();
                this.showToast('Success', 'Transaction updated successfully!', 'success');
                return;
            }
        }

        const transaction = {
            id: 'trans_' + Date.now(), date, type, category, amount, accountId, description,
            receipt: null, createdAt: new Date().toISOString()
        };

        const receiptFile = document.getElementById('transReceipt').files[0];
        if (receiptFile) {
            const reader = new FileReader();
            reader.onload = (e) => {
                transaction.receipt = e.target.result;
                this.finalizeTransaction(transaction, accountId, amount, type);
            };
            reader.readAsDataURL(receiptFile);
        } else {
            this.finalizeTransaction(transaction, accountId, amount, type);
        }
    }

    finalizeTransaction(transaction, accountId, amount, type) {
        this.transactions.push(transaction);
        this.updateAccountBalance(accountId, amount, type);
        this.saveToStorage(); this.updateUI();
        this.resetTransactionForm();
        this.closeTransactionModal();
        this.showToast('Success', type.charAt(0).toUpperCase() + type.slice(1) + ' added successfully!', 'success');
    }

    openTransactionModal() {
        const modal = document.getElementById('transactionModal');
        document.getElementById('transactionForm').reset();
        this.setDefaultDate();
        this.editingTransactionId = null;
        this._overdraftConfirmed = false;
        modal.querySelector('.modal-header h3').textContent = 'Add Transaction';
        document.getElementById('transSubmitBtn').textContent = 'Add Transaction';
        // Lock category until type is selected
        const transCategory = document.getElementById('transCategory');
        if (transCategory) {
            transCategory.disabled = true;
            transCategory.innerHTML = '<option value="">Select type first</option>';
        }
        modal.classList.add('active');
    }

    closeTransactionModal() {
        this._overdraftConfirmed = false;
        document.getElementById('transactionModal').classList.remove('active');
    }

    updateAccountBalance(accountId, amount, type) {
        const account = this.accounts.find(a => a.id === accountId);
        if (account) account.balance += type === 'income' ? amount : -amount;
    }

    resetTransactionForm() {
        document.getElementById('transactionForm').reset();
        this.setDefaultDate();
        // Reset file upload preview
        const preview = document.getElementById('receiptPreview');
        const content = document.getElementById('receiptUploadContent');
        if (preview) preview.classList.add('hide');
        if (content) content.classList.remove('hide');
        // Reset category to disabled
        const transCategory = document.getElementById('transCategory');
        if (transCategory) {
            transCategory.disabled = true;
            transCategory.innerHTML = '<option value="">Select type first</option>';
        }
    }

    showReceiptPreview(file) {
        if (!file || !file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            document.getElementById('receiptPreviewImg').src = e.target.result;
            document.getElementById('receiptPreview').classList.remove('hide');
            document.getElementById('receiptUploadContent').classList.add('hide');
        };
        reader.readAsDataURL(file);
    }

    openEditTransaction(id) {
        const t = this.transactions.find(t => t.id === id);
        if (!t) return;
        const modal = document.getElementById('transactionModal');
        document.getElementById('transDate').value = t.date;
        document.getElementById('transType').value = t.type;
        this.updateCategorySelectors();
        document.getElementById('transCategory').value = t.category;
        document.getElementById('transAmount').value = t.amount;
        document.getElementById('transAccount').value = t.accountId;
        document.getElementById('transDescription').value = t.description;
        this.editingTransactionId = id;
        modal.querySelector('.modal-header h3').textContent = 'Edit Transaction';
        document.getElementById('transSubmitBtn').textContent = 'Update Transaction';
        modal.classList.add('active');
    }

    deleteTransaction(id) {
        if (!confirm('Are you sure? This action cannot be undone.')) return;
        const t = this.transactions.find(t => t.id === id);
        if (t) {
            this.updateAccountBalance(t.accountId, t.amount, t.type === 'income' ? 'expense' : 'income');
            this.transactions = this.transactions.filter(t => t.id !== id);
            this.saveToStorage(); this.updateUI();
            if (this.currentPage === 'transactions') this.renderTransactions();
        }
    }

    // --- Transfer Between Accounts ---

    openTransferModal() {
        const modal = document.getElementById('transferModal');
        document.getElementById('transferForm').reset();
        const fromSelect = document.getElementById('transferFrom');
        const toSelect = document.getElementById('transferTo');
        fromSelect.innerHTML = '<option value="">Select Source</option>';
        toSelect.innerHTML = '<option value="">Select Destination</option>';
        this.accounts.forEach(acc => {
            fromSelect.innerHTML += '<option value="' + acc.id + '">' + acc.name + ' (' + this.formatCurrency(acc.balance) + ')</option>';
            toSelect.innerHTML += '<option value="' + acc.id + '">' + acc.name + ' (' + this.formatCurrency(acc.balance) + ')</option>';
        });
        modal.classList.add('active');
    }

    executeTransfer() {
        const fromId = document.getElementById('transferFrom').value;
        const toId = document.getElementById('transferTo').value;
        const amount = parseFloat(document.getElementById('transferAmount').value);
        const note = document.getElementById('transferNote').value;

        if (fromId === toId) {
            this.showToast('Error', 'Source and destination must be different', 'error');
            return;
        }
        const fromAcc = this.accounts.find(a => a.id === fromId);
        const toAcc = this.accounts.find(a => a.id === toId);
        if (!fromAcc || !toAcc) return;

        if (fromAcc.balance < amount) {
            this.showToast('Insufficient Funds', fromAcc.name + ' only has ' + this.formatCurrency(fromAcc.balance) + '. Transfer cancelled.', 'warning');
            return;
        }

        fromAcc.balance -= amount;
        toAcc.balance += amount;

        const timestamp = Date.now();
        this.transactions.push({
            id: 'trans_' + timestamp + '_out', date: new Date().toISOString().split('T')[0],
            type: 'expense', category: 'transfer', amount, accountId: fromId,
            description: 'Transfer to ' + toAcc.name + (note ? ': ' + note : ''),
            receipt: null, isTransfer: true, createdAt: new Date().toISOString()
        });
        this.transactions.push({
            id: 'trans_' + timestamp + '_in', date: new Date().toISOString().split('T')[0],
            type: 'income', category: 'transfer', amount, accountId: toId,
            description: 'Transfer from ' + fromAcc.name + (note ? ': ' + note : ''),
            receipt: null, isTransfer: true, createdAt: new Date().toISOString()
        });

        this.saveToStorage(); this.updateUI();
        document.getElementById('transferModal').classList.remove('active');
        this.showToast('Success', 'Transferred ' + this.formatCurrency(amount) + ' from ' + fromAcc.name + ' to ' + toAcc.name, 'success');
    }

    // --- Budgets ---

    openBudgetModal(budgetId) {
        const modal = document.getElementById('budgetModal');
        const form = document.getElementById('budgetForm');
        this.updateCategorySelectors();
        if (budgetId) {
            const budget = this.budgets.find(b => b.id === budgetId);
            if (budget) {
                document.getElementById('budgetCategory').value = budget.category;
                document.getElementById('budgetAmount').value = budget.limit;
                form.dataset.budgetId = budgetId;
            }
        } else {
            form.reset();
            delete form.dataset.budgetId;
        }
        modal.classList.add('active');
    }

    saveBudget() {
        const form = document.getElementById('budgetForm');
        const budgetId = form.dataset.budgetId;
        const category = document.getElementById('budgetCategory').value;
        const limit = parseFloat(document.getElementById('budgetAmount').value);

        const existing = this.budgets.find(b => b.category === category && b.id !== budgetId);
        if (existing) {
            this.showToast('Error', 'Budget for this category already exists', 'error');
            return;
        }

        const budget = {
            id: budgetId || 'budget_' + Date.now(),
            category, limit,
            createdAt: budgetId ? (this.budgets.find(b => b.id === budgetId) || {}).createdAt : new Date().toISOString()
        };

        if (budgetId) {
            const idx = this.budgets.findIndex(b => b.id === budgetId);
            this.budgets[idx] = budget;
            this.showToast('Updated', 'Budget updated', 'success');
        } else {
            this.budgets.push(budget);
            this.showToast('Success', 'Budget created!', 'success');
        }
        this.saveToStorage(); this.renderBudgets();
        this.closeModalByElement(form);
    }

    deleteBudget(id) {
        if (!confirm('Delete this budget?')) return;
        this.budgets = this.budgets.filter(b => b.id !== id);
        this.saveToStorage(); this.renderBudgets();
    }

    renderBudgets() {
        const container = document.getElementById('budgetsList');
        if (!container) return;
        container.innerHTML = '';

        if (this.budgets.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-bullseye"></i><p>No budgets set yet</p><p class="text-muted">Set monthly spending limits by category</p></div>';
            return;
        }

        const now = new Date();
        const month = now.getFullYear() + '-' + (now.getMonth() + 1).toString().padStart(2, '0');
        const monthlyExpenses = this.transactions.filter(t => t.type === 'expense' && t.date.startsWith(month) && !t.isTransfer);

        this.budgets.forEach(budget => {
            const spent = monthlyExpenses.filter(t => t.category === budget.category).reduce((sum, t) => sum + t.amount, 0);
            const pct = budget.limit > 0 ? Math.min((spent / budget.limit) * 100, 100) : 0;
            const remaining = budget.limit - spent;
            const isOver = spent > budget.limit;

            const card = document.createElement('div');
            card.className = 'budget-card' + (isOver ? ' over-budget' : '');
            card.innerHTML = '<div class="budget-header"><div class="budget-category">' + this.getCategoryLabel(budget.category) + '</div><div class="budget-actions"><button class="btn-action edit" title="Edit" onclick="tracker.openBudgetModal(\'' + budget.id + '\')"><i class="fas fa-edit"></i></button><button class="btn-action delete" title="Delete" onclick="tracker.deleteBudget(\'' + budget.id + '\')"><i class="fas fa-trash"></i></button></div></div><div class="budget-progress-container"><div class="budget-progress"><div class="budget-progress-bar' + (isOver ? ' over' : '') + '" style="width: ' + pct + '%"></div></div><div class="budget-stats"><span class="budget-spent">' + this.formatCurrency(spent) + ' spent</span><span class="budget-limit">of ' + this.formatCurrency(budget.limit) + '</span></div><div class="budget-remaining ' + (isOver ? 'text-danger' : 'text-success') + '">' + (isOver ? 'Over by ' + this.formatCurrency(Math.abs(remaining)) : this.formatCurrency(remaining) + ' remaining') + '</div></div>';
            container.appendChild(card);
        });
    }

    // --- Recurring Expenses Auto-Processing ---

    processRecurringExpenses() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let changed = false;

        this.upcomingExpenses.forEach(expense => {
            if (!expense.recurring) return;
            const dueDate = new Date(expense.dueDate);
            dueDate.setHours(0, 0, 0, 0);

            while (dueDate < today) {
                this.transactions.push({
                    id: 'trans_auto_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                    date: expense.dueDate, type: 'expense',
                    category: expense.category || 'other_expense',
                    amount: expense.amount,
                    accountId: this.accounts[0] ? this.accounts[0].id : '',
                    description: '[Auto] ' + expense.name + ' (recurring)',
                    receipt: null, createdAt: new Date().toISOString()
                });
                if (this.accounts[0]) this.accounts[0].balance -= expense.amount;
                dueDate.setMonth(dueDate.getMonth() + 1);
                expense.dueDate = dueDate.toISOString().split('T')[0];
                changed = true;
            }
        });
        if (changed) this.saveToStorage();
    }

    // --- Bill Reminders ---

    checkBillReminders() {
        if (this.reminderDismissed) return;
        const today = new Date();
        const daysOut = new Date(today);
        const reminderDays = this.settings.reminderDays || 3;
        daysOut.setDate(daysOut.getDate() + reminderDays);

        const urgentBills = this.upcomingExpenses.filter(e => {
            const due = new Date(e.dueDate);
            return due >= today && due <= daysOut;
        });

        const banner = document.getElementById('billReminderBanner');
        const text = document.getElementById('billReminderText');
        if (!banner || !text) return;
        if (urgentBills.length > 0) {
            const total = urgentBills.reduce((s, b) => s + b.amount, 0);
            text.textContent = urgentBills.length + ' bill' + (urgentBills.length > 1 ? 's' : '') + ' due within ' + reminderDays + ' days (' + this.formatCurrency(total) + ' total)';
            banner.classList.remove('hide');
        } else {
            banner.classList.add('hide');
        }
    }

    dismissReminder() {
        this.reminderDismissed = true;
        document.getElementById('billReminderBanner').classList.add('hide');
    }

    // --- Export / Import ---

    exportBackup() {
        const data = localStorage.getItem('financeTrackerData');
        if (!data) { this.showToast('Error', 'No data to export', 'error'); return; }
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'fintrack-backup-' + new Date().toISOString().split('T')[0] + '.json';
        a.click();
        URL.revokeObjectURL(url);
        this.showToast('Success', 'Backup downloaded', 'success');
    }

    importBackup(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (!data.accounts || !Array.isArray(data.accounts)) throw new Error('Invalid backup format');
                if (!confirm('This will replace ALL current data. Continue?')) return;
                localStorage.setItem('financeTrackerData', JSON.stringify(data));
                this.loadFromStorage();
                this.updateCategorySelectors();
                this.updateUI();
                this.showToast('Success', 'Data restored from backup!', 'success');
            } catch (err) {
                this.showToast('Error', 'Invalid backup file', 'error');
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    }

    exportCSV() {
        if (this.transactions.length === 0) {
            this.showToast('Error', 'No transactions to export', 'error'); return;
        }
        const headers = ['Date', 'Type', 'Category', 'Amount', 'Account', 'Description'];
        const rows = this.transactions.map(t => {
            const acc = this.accounts.find(a => a.id === t.accountId);
            return [t.date, t.type, this.getCategoryLabel(t.category), t.amount.toFixed(2),
                acc ? acc.name : 'Unknown', '"' + (t.description || '').replace(/"/g, '""') + '"'].join(',');
        });
        const csv = [headers.join(',')].concat(rows).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'fintrack-transactions-' + new Date().toISOString().split('T')[0] + '.csv';
        a.click();
        URL.revokeObjectURL(url);
        this.showToast('Success', 'CSV exported', 'success');
    }

    resetAllData() {
        if (!confirm('This will permanently delete ALL your data (transactions, accounts, budgets, goals, upcoming expenses, and custom categories). This cannot be undone. Continue?')) return;
        localStorage.removeItem('financeTrackerData');
        this.transactions = [];
        this.accounts = [];
        this.goals = [];
        this.upcomingExpenses = [];
        this.budgets = [];
        this.customCategories = { income: [], expense: [] };
        this.createDefaultAccount();
        this.updateCategorySelectors();
        this.updateUI();
        this.showToast('Reset Complete', 'All data has been cleared', 'info');
    }

    // --- Helpers ---

    getTotalBalance() {
        return this.accounts.reduce((sum, acc) => sum + acc.balance, 0);
    }

    getMonthlyTransactions(month) {
        if (!month) {
            const now = new Date();
            month = now.getFullYear() + '-' + (now.getMonth() + 1).toString().padStart(2, '0');
        }
        return this.transactions.filter(t => t.date.startsWith(month));
    }

    getMonthlyIncome() {
        return this.getMonthlyTransactions().filter(t => t.type === 'income' && !t.isTransfer).reduce((sum, t) => sum + t.amount, 0);
    }

    getMonthlyExpenses() {
        return this.getMonthlyTransactions().filter(t => t.type === 'expense' && !t.isTransfer).reduce((sum, t) => sum + t.amount, 0);
    }

    formatCurrency(amount) {
        const symbols = { LKR: 'Rs.', USD: '$', EUR: '\u20AC', GBP: '\u00A3', INR: '\u20B9', JPY: '\u00A5', AUD: 'A$', CAD: 'C$', AED: 'AED ', SAR: 'SAR ' };
        const converted = this.convertAmount(amount);
        const symbol = symbols[this.currency] || '$';
        const abs = Math.abs(converted);
        const formatted = abs.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        return (converted < 0 ? '-' : '') + symbol + formatted;
    }

    showToast(title, message, type, duration) {
        if (!duration) duration = 4000;
        const container = this.getOrCreateToastContainer();
        const toast = document.createElement('div');
        toast.className = 'toast ' + type;
        const icons = { success: 'fas fa-check-circle', error: 'fas fa-times-circle', warning: 'fas fa-exclamation-circle', info: 'fas fa-info-circle' };
        const titleEl = document.createElement('div'); titleEl.className = 'toast-title'; titleEl.textContent = title;
        const msgEl = document.createElement('div'); msgEl.className = 'toast-message'; msgEl.textContent = message;
        const contentEl = document.createElement('div'); contentEl.className = 'toast-content'; contentEl.appendChild(titleEl); contentEl.appendChild(msgEl);
        const iconEl = document.createElement('div'); iconEl.className = 'toast-icon'; iconEl.innerHTML = '<i class="' + (icons[type] || icons.info) + '"></i>';
        toast.appendChild(iconEl); toast.appendChild(contentEl);
        container.appendChild(toast);
        setTimeout(function() {
            toast.classList.add('removing');
            setTimeout(function() { toast.remove(); }, 300);
        }, duration);
    }

    getOrCreateToastContainer() {
        var c = document.querySelector('.toast-container');
        if (!c) { c = document.createElement('div'); c.className = 'toast-container'; document.body.appendChild(c); }
        return c;
    }

    // --- UI Updates ---

    updateUI() {
        const balance = this.getTotalBalance();
        const balanceEl = document.getElementById('totalBalance');
        balanceEl.textContent = this.formatCurrency(balance);
        balanceEl.style.color = balance < 0 ? 'var(--danger-color)' : 'var(--success-color)';
        const incomeEl = document.getElementById('monthlyIncome');
        incomeEl.textContent = this.formatCurrency(this.getMonthlyIncome());
        incomeEl.style.color = 'var(--success-color)';
        const expenseEl = document.getElementById('monthlyExpense');
        expenseEl.textContent = this.formatCurrency(this.getMonthlyExpenses());
        expenseEl.style.color = 'var(--danger-color)';
        this.updateAccountSelectors();
        this.renderAccounts();
        this.renderGoals();
        this.renderHomeGoals();
        this.renderUpcomingExpenses();
        this.renderHomeUpcoming();
        this.renderRecentTransactions();
        this.renderBudgets();
        this.checkBillReminders();
    }

    updateAccountSelectors() {
        var accountSelect = document.getElementById('transAccount');
        accountSelect.innerHTML = '<option value="">Select Account</option>';
        this.accounts.forEach(function(account) {
            var option = document.createElement('option');
            option.value = account.id;
            option.textContent = account.name + ' (' + this.formatCurrency(account.balance) + ')';
            accountSelect.appendChild(option);
        }.bind(this));
        if (this.settings.defaultAccount) {
            accountSelect.value = this.settings.defaultAccount;
        }
    }

    // --- Render Transactions ---

    renderTransactions() {
        const searchTerm = document.getElementById('searchTransactions').value.toLowerCase();
        const sortBy = document.getElementById('sortBy').value;
        let filtered = this.transactions.filter(t =>
            (t.description || '').toLowerCase().includes(searchTerm) || t.category.toLowerCase().includes(searchTerm)
        );
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'date-asc': return new Date(a.date) - new Date(b.date);
                case 'amount-desc': return b.amount - a.amount;
                case 'amount-asc': return a.amount - b.amount;
                default: return new Date(b.date) - new Date(a.date);
            }
        });
        const incomeList = document.getElementById('incomeList');
        const expenseList = document.getElementById('expenseList');
        incomeList.innerHTML = '';
        expenseList.innerHTML = '';
        filtered.forEach(t => {
            const item = this.createTransactionElement(t);
            (t.type === 'income' ? incomeList : expenseList).appendChild(item);
        });
        if (filtered.length === 0) incomeList.innerHTML = '<p class="text-muted text-center">No transactions found</p>';
    }

    createTransactionElement(transaction) {
        const div = document.createElement('div');
        div.className = 'transaction-item ' + transaction.type + (transaction.isTransfer ? ' transfer' : '');
        const date = new Date(transaction.date).toLocaleDateString();
        const categoryLabel = this.getCategoryLabel(transaction.category);
        div.innerHTML = '<div class="transaction-info"><div class="transaction-category">' + (transaction.isTransfer ? '\u21C4 ' : '') + categoryLabel + '</div><div class="transaction-description">' + (transaction.description || 'No description') + '</div><div class="transaction-date">' + date + '</div></div><div class="transaction-amount">' + this.formatCurrency(transaction.amount) + '</div><div class="transaction-actions">' + (transaction.receipt ? '<button class="btn-action receipt" title="View receipt" onclick="tracker.viewReceipt(\'' + transaction.id + '\')"><i class="fas fa-image"></i></button>' : '') + (!transaction.isTransfer ? '<button class="btn-action edit" title="Edit" onclick="tracker.openEditTransaction(\'' + transaction.id + '\')"><i class="fas fa-edit"></i></button><button class="btn-action delete" title="Delete" onclick="tracker.deleteTransaction(\'' + transaction.id + '\')"><i class="fas fa-trash"></i></button>' : '') + '</div>';
        return div;
    }

    viewReceipt(transactionId) {
        const t = this.transactions.find(t => t.id === transactionId);
        if (!t || !t.receipt) return;
        const modal = document.getElementById('receiptModal');
        document.getElementById('receiptImage').src = t.receipt;
        document.getElementById('receiptInfo').innerHTML = '<div class="receipt-info-row"><span class="receipt-info-label">Date:</span><span>' + new Date(t.date).toLocaleDateString() + '</span></div><div class="receipt-info-row"><span class="receipt-info-label">Amount:</span><span>' + this.formatCurrency(t.amount) + '</span></div><div class="receipt-info-row"><span class="receipt-info-label">Category:</span><span>' + this.getCategoryLabel(t.category) + '</span></div>';
        modal.classList.add('active');
    }

    renderRecentTransactions() {
        const list = document.getElementById('recentTransactions');
        list.innerHTML = '';
        const recent = this.transactions.slice(-5).reverse();
        if (recent.length === 0) { list.innerHTML = '<p class="text-muted">No transactions yet</p>'; return; }
        recent.forEach(t => list.appendChild(this.createTransactionElement(t)));
    }

    // --- Goals ---

    renderGoals() {
        const goalsListSidebar = document.getElementById('goalsListSidebar');
        if (!goalsListSidebar) return;
        goalsListSidebar.innerHTML = '';
        if (this.goals.length === 0) {
            goalsListSidebar.innerHTML = '<p class="text-muted" style="font-size: 12px;">No goals yet</p>';
        } else {
            this.goals.forEach(goal => {
                const item = document.createElement('div');
                item.className = 'sidebar-goal-item';
                item.innerHTML = '<div class="sidebar-item-name">' + goal.name + '</div><div class="sidebar-item-info">' + this.formatCurrency(goal.current) + ' / ' + this.formatCurrency(goal.target) + '</div>';
                item.addEventListener('click', () => this.editGoal(goal.id));
                goalsListSidebar.appendChild(item);
            });
        }
    }

    openGoalModal(goalId) {
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

    editGoal(id) { this.openGoalModal(id); }

    saveGoal() {
        const form = document.getElementById('goalForm');
        const goalId = form.dataset.goalId;
        const goal = {
            id: goalId || 'goal_' + Date.now(),
            name: document.getElementById('goalName').value,
            target: parseFloat(document.getElementById('goalTarget').value),
            current: parseFloat(document.getElementById('goalCurrent').value),
            deadline: document.getElementById('goalDeadline').value,
            createdAt: goalId ? (this.goals.find(g => g.id === goalId) || {}).createdAt : new Date().toISOString()
        };
        if (goalId) {
            this.goals[this.goals.findIndex(g => g.id === goalId)] = goal;
            this.showToast('Updated', 'Savings goal updated!', 'success');
        } else {
            this.goals.push(goal);
            this.showToast('Success', 'Savings goal created!', 'success');
        }
        this.saveToStorage(); this.updateUI();
        this.closeModalByElement(form);
    }

    deleteGoal(id) {
        if (!confirm('Delete this goal?')) return;
        this.goals = this.goals.filter(g => g.id !== id);
        this.saveToStorage(); this.updateUI();
    }

    addMoneyToGoal(goalId) {
        const goal = this.goals.find(g => g.id === goalId);
        if (!goal) return;
        this.openPopover('addMoney', goalId, 'Add Money to ' + goal.name, goal.target - goal.current);
    }

    renderHomeGoals() {
        const goalsList = document.getElementById('goalsListHome');
        if (!goalsList) return;
        const badge = document.querySelector('.goals-featured .featured-badge');
        if (badge) badge.textContent = this.goals.length;
        goalsList.innerHTML = '';
        if (this.goals.length === 0) {
            goalsList.innerHTML = '<p class="text-muted">No savings goals yet</p>';
        } else {
            this.goals.forEach(goal => {
                const progress = (goal.current / goal.target) * 100;
                const daysLeft = Math.ceil((new Date(goal.deadline) - new Date()) / (1000 * 60 * 60 * 24));
                const isCompleted = goal.current >= goal.target;
                const item = document.createElement('div');
                item.className = 'goal-item-home' + (isCompleted ? ' goal-completed' : '');
                item.innerHTML = '<div class="goal-info"><div class="goal-name">' + goal.name + (isCompleted ? ' <span class="goal-completed-badge">✅ Completed</span>' : '') + '</div><div class="goal-progress"><div class="goal-progress-bar' + (isCompleted ? ' completed' : '') + '" style="width: ' + Math.min(progress, 100) + '%"></div></div><div class="goal-stats"><div class="goal-stat"><span>' + this.formatCurrency(goal.current) + ' / ' + this.formatCurrency(goal.target) + '</span></div><div class="goal-stat"><span>' + (isCompleted ? 'Goal reached!' : daysLeft + ' days left') + '</span></div></div></div><div class="transaction-actions">' + (!isCompleted ? '<button class="btn-pay" title="Add money" onclick="tracker.addMoneyToGoal(\'' + goal.id + '\')"><i class="fas fa-plus"></i> Add</button>' : '') + '<button class="btn-action edit" title="Edit" onclick="tracker.editGoal(\'' + goal.id + '\')"><i class="fas fa-edit"></i></button><button class="btn-action delete" title="Delete" onclick="tracker.deleteGoal(\'' + goal.id + '\')"><i class="fas fa-trash"></i></button></div>';
                goalsList.appendChild(item);
            });
        }
    }

    // --- Upcoming Expenses ---

    renderUpcomingExpenses() {
        const upcomingListSidebar = document.getElementById('upcomingListSidebar');
        const today = new Date();
        const upcoming = this.upcomingExpenses.filter(e => new Date(e.dueDate) >= today);
        upcoming.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        if (upcomingListSidebar) {
            upcomingListSidebar.innerHTML = '';
            if (upcoming.length === 0) {
                upcomingListSidebar.innerHTML = '<p class="text-muted" style="font-size: 12px;">No upcoming</p>';
            } else {
                upcoming.slice(0, 5).forEach(expense => {
                    const daysUntil = Math.ceil((new Date(expense.dueDate) - today) / (1000 * 60 * 60 * 24));
                    const item = document.createElement('div');
                    item.className = 'sidebar-upcoming-item';
                    item.innerHTML = '<div class="sidebar-item-name">' + expense.name + '</div><div class="sidebar-item-info">' + daysUntil + ' days \u2022 ' + this.formatCurrency(expense.amount) + '</div>';
                    item.addEventListener('click', () => this.editUpcoming(expense.id));
                    upcomingListSidebar.appendChild(item);
                });
            }
        }
    }

    openUpcomingModal(expenseId) {
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

    editUpcoming(id) { this.openUpcomingModal(id); }

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
            createdAt: expenseId ? (this.upcomingExpenses.find(e => e.id === expenseId) || {}).createdAt : new Date().toISOString()
        };
        if (expenseId) {
            this.upcomingExpenses[this.upcomingExpenses.findIndex(e => e.id === expenseId)] = expense;
            this.showToast('Updated', 'Upcoming expense updated!', 'success');
        } else {
            this.upcomingExpenses.push(expense);
            this.showToast('Success', 'Upcoming expense added!', 'success');
        }
        this.saveToStorage(); this.updateUI();
        this.closeModalByElement(form);
    }

    deleteUpcoming(id) {
        if (!confirm('Delete this expense?')) return;
        this.upcomingExpenses = this.upcomingExpenses.filter(e => e.id !== id);
        this.saveToStorage(); this.updateUI();
    }

    payUpcomingExpense(expenseId) {
        const expense = this.upcomingExpenses.find(e => e.id === expenseId);
        if (!expense) return;
        this.openPopover('payExpense', expenseId, 'Pay ' + expense.name, expense.amount);
    }

    renderHomeUpcoming() {
        const upcomingList = document.getElementById('upcomingListHome');
        if (!upcomingList) return;
        const today = new Date();
        const upcoming = this.upcomingExpenses.filter(e => new Date(e.dueDate) >= today);
        upcoming.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
        const badge = document.querySelector('.expenses-featured .featured-badge');
        if (badge) badge.textContent = upcoming.length;
        upcomingList.innerHTML = '';
        if (upcoming.length === 0) {
            upcomingList.innerHTML = '<p class="text-muted">No upcoming expenses</p>';
        } else {
            upcoming.forEach(expense => {
                const daysUntil = Math.ceil((new Date(expense.dueDate) - today) / (1000 * 60 * 60 * 24));
                const isUrgent = daysUntil <= 3;
                const item = document.createElement('div');
                item.className = 'upcoming-item-home';
                if (isUrgent) item.style.borderLeftColor = 'var(--expense-color)';
                item.innerHTML = '<div class="upcoming-info"><div class="upcoming-name">' + expense.name + '</div><div class="upcoming-date">Due: ' + new Date(expense.dueDate).toLocaleDateString() + (expense.recurring ? ' \uD83D\uDD04' : '') + '</div><div class="upcoming-status' + (isUrgent ? ' urgent' : '') + '">' + daysUntil + ' day' + (daysUntil !== 1 ? 's' : '') + ' left</div></div><div class="upcoming-actions"><div class="transaction-amount">' + this.formatCurrency(expense.amount) + '</div><div class="transaction-actions"><button class="btn-pay" title="Pay now" onclick="tracker.payUpcomingExpense(\'' + expense.id + '\')"><i class="fas fa-check"></i> Pay</button><button class="btn-action edit" title="Edit" onclick="tracker.editUpcoming(\'' + expense.id + '\')"><i class="fas fa-edit"></i></button><button class="btn-action delete" title="Delete" onclick="tracker.deleteUpcoming(\'' + expense.id + '\')"><i class="fas fa-trash"></i></button></div></div>';
                upcomingList.appendChild(item);
            });
        }
    }

    // --- Accounts ---

    renderAccounts() {
        const accountsList = document.getElementById('accountsList');
        accountsList.innerHTML = '';
        if (this.accounts.length === 0) {
            accountsList.innerHTML = '<p class="text-muted">No accounts yet</p>';
            return;
        }
        this.accounts.forEach(account => {
            const item = document.createElement('div');
            item.className = 'account-card account-' + account.type;
            item.innerHTML = '<div class="account-type">' + this.getAccountTypeLabel(account.type) + '</div><div class="account-name">' + account.name + '</div><div class="account-balance">' + this.formatCurrency(account.balance) + '</div><div class="account-footer"><button class="btn-action edit" title="Edit" onclick="tracker.editAccount(\'' + account.id + '\')"><i class="fas fa-edit"></i></button><button class="btn-action delete" title="Delete" onclick="tracker.deleteAccount(\'' + account.id + '\')"><i class="fas fa-trash"></i></button></div>';
            accountsList.appendChild(item);
        });
    }

    getAccountTypeLabel(type) {
        var labels = { checking: 'Checking', savings: 'Savings', investment: 'Investment', crypto: 'Crypto', other: 'Other' };
        return labels[type] || type;
    }

    openAccountModal(accountId) {
        const modal = document.getElementById('accountModal');
        const form = document.getElementById('accountForm');
        if (accountId) {
            const account = this.accounts.find(a => a.id === accountId);
            if (account) {
                document.getElementById('accountName').value = account.name;
                document.getElementById('accountType').value = account.type;
                document.getElementById('accountBalance').value = account.balance;
                form.dataset.accountId = accountId;
            }
        } else {
            form.reset();
            delete form.dataset.accountId;
        }
        modal.classList.add('active');
    }

    editAccount(id) { this.openAccountModal(id); }

    saveAccount() {
        const form = document.getElementById('accountForm');
        const accountId = form.dataset.accountId;
        const account = {
            id: accountId || 'acc_' + Date.now(),
            name: document.getElementById('accountName').value,
            type: document.getElementById('accountType').value,
            balance: parseFloat(document.getElementById('accountBalance').value),
            createdAt: accountId ? (this.accounts.find(a => a.id === accountId) || {}).createdAt : new Date().toISOString()
        };
        if (accountId) {
            this.accounts[this.accounts.findIndex(a => a.id === accountId)] = account;
            this.showToast('Updated', 'Account updated!', 'success');
        } else {
            this.accounts.push(account);
            this.showToast('Success', 'Account created!', 'success');
        }
        this.saveToStorage(); this.updateUI();
        this.closeModalByElement(form);
    }

    deleteAccount(id) {
        if (this.accounts.length === 1) { alert('You must have at least one account'); return; }
        if (!confirm('Delete this account? Associated transactions will remain.')) return;
        this.accounts = this.accounts.filter(a => a.id !== id);
        this.saveToStorage(); this.updateUI();
    }

    // --- Charts ---

    renderCharts() {
        const monthInput = document.getElementById('summaryMonth').value;
        let month = monthInput;
        if (!month) {
            const now = new Date();
            month = now.getFullYear() + '-' + (now.getMonth() + 1).toString().padStart(2, '0');
            document.getElementById('summaryMonth').value = month;
        }

        const monthlyTransactions = this.getMonthlyTransactions(month);
        const income = monthlyTransactions.filter(t => t.type === 'income' && !t.isTransfer).reduce((s, t) => s + t.amount, 0);
        const expense = monthlyTransactions.filter(t => t.type === 'expense' && !t.isTransfer).reduce((s, t) => s + t.amount, 0);

        document.getElementById('summaryIncome').textContent = this.formatCurrency(income);
        document.getElementById('summaryExpense').textContent = this.formatCurrency(expense);
        const net = income - expense;
        const summaryNetEl = document.getElementById('summaryNet');
        summaryNetEl.textContent = this.formatCurrency(net);
        summaryNetEl.style.color = net < 0 ? 'var(--danger-color)' : 'var(--success-color)';

        const categoryTotals = {};
        monthlyTransactions.filter(t => !t.isTransfer).forEach(t => {
            categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
        });
        const topCat = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0];
        document.getElementById('topCategory').textContent = topCat ? this.getCategoryLabel(topCat[0]) : '-';

        Object.values(this.charts).forEach(chart => chart.destroy());
        this.charts = {};

        // Overview Chart
        var overviewCtx = document.getElementById('overviewChart').getContext('2d');
        this.charts.overview = new Chart(overviewCtx, {
            type: 'bar',
            data: {
                labels: ['Income', 'Expenses'],
                datasets: [{ label: 'Amount', data: [income, expense], backgroundColor: ['#10b981', '#ef4444'], borderRadius: 8, borderSkipped: false }]
            },
            options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
        });

        // Expense Categories Doughnut
        var expensesByCategory = {};
        monthlyTransactions.filter(t => t.type === 'expense' && !t.isTransfer).forEach(t => {
            expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
        });
        var catCtx = document.getElementById('categoryChart').getContext('2d');
        this.charts.category = new Chart(catCtx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(expensesByCategory).map(c => this.getCategoryLabel(c)),
                datasets: [{ data: Object.values(expensesByCategory), backgroundColor: ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#0ea5e9', '#8b5cf6', '#ef4444', '#f97316'] }]
            },
            options: { responsive: true, plugins: { legend: { position: 'right' } } }
        });

        // Income Pie
        var incomeByCategory = {};
        monthlyTransactions.filter(t => t.type === 'income' && !t.isTransfer).forEach(t => {
            incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + t.amount;
        });
        var incCtx = document.getElementById('incomeChart').getContext('2d');
        this.charts.income = new Chart(incCtx, {
            type: 'pie',
            data: {
                labels: Object.keys(incomeByCategory).map(c => this.getCategoryLabel(c)),
                datasets: [{ data: Object.values(incomeByCategory), backgroundColor: ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#0ea5e9'] }]
            },
            options: { responsive: true, plugins: { legend: { position: 'right' } } }
        });

        // Account Distribution
        var accCtx = document.getElementById('accountChart').getContext('2d');
        this.charts.account = new Chart(accCtx, {
            type: 'bar',
            data: {
                labels: this.accounts.map(a => a.name),
                datasets: [{ label: 'Balance', data: this.accounts.map(a => a.balance), backgroundColor: '#6366f1', borderRadius: 8, borderSkipped: false }]
            },
            options: { indexAxis: 'y', responsive: true, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true } } }
        });

        // 6-Month Trend Chart
        this.renderTrendChart(month);
    }

    renderTrendChart(currentMonth) {
        var months = [];
        var parts = currentMonth.split('-');
        var year = parseInt(parts[0]);
        var mon = parseInt(parts[1]);

        for (var i = 5; i >= 0; i--) {
            var m = mon - i;
            var y = year;
            while (m <= 0) { m += 12; y--; }
            months.push(y + '-' + m.toString().padStart(2, '0'));
        }

        var incomeData = [];
        var expenseData = [];
        var labels = [];

        for (var j = 0; j < months.length; j++) {
            var trans = this.getMonthlyTransactions(months[j]);
            incomeData.push(trans.filter(t => t.type === 'income' && !t.isTransfer).reduce((s, t) => s + t.amount, 0));
            expenseData.push(trans.filter(t => t.type === 'expense' && !t.isTransfer).reduce((s, t) => s + t.amount, 0));
            var mp = months[j].split('-');
            var date = new Date(parseInt(mp[0]), parseInt(mp[1]) - 1);
            labels.push(date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }));
        }

        var trendCtx = document.getElementById('trendChart').getContext('2d');
        this.charts.trend = new Chart(trendCtx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Income', data: incomeData,
                        borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        fill: true, tension: 0.4, pointRadius: 4, pointHoverRadius: 6
                    },
                    {
                        label: 'Expenses', data: expenseData,
                        borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        fill: true, tension: 0.4, pointRadius: 4, pointHoverRadius: 6
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: { legend: { position: 'top' } },
                scales: { y: { beginAtZero: true } }
            }
        });
    }

    // --- Modal Management ---

    closeModal(e) {
        if (e.target.classList.contains('modal-close') || e.target.classList.contains('modal-close-btn')) {
            var modal = e.target.closest('.modal');
            if (modal) modal.classList.remove('active');
        }
    }

    closeModalByElement(element) {
        var modal = element.closest('.modal');
        if (modal) modal.classList.remove('active');
    }

    // --- Popover System ---

    openPopover(action, targetId, title, prefillAmount) {
        this.popoverAction = action;
        this.popoverTargetId = targetId;

        const popover = document.getElementById('actionPopover');
        document.getElementById('popoverTitle').textContent = title;
        document.getElementById('popoverAmount').value = prefillAmount || '';

        // Lock amount field for pay expense
        const amountInput = document.getElementById('popoverAmount');
        amountInput.readOnly = (action === 'payExpense');

        // Populate accounts
        const accSelect = document.getElementById('popoverAccount');
        accSelect.innerHTML = '';
        this.accounts.forEach(acc => {
            const opt = document.createElement('option');
            opt.value = acc.id;
            opt.textContent = acc.name + ' (' + this.formatCurrency(acc.balance) + ')';
            accSelect.appendChild(opt);
        });
        // Pre-select default account
        if (this.settings.defaultAccount) {
            accSelect.value = this.settings.defaultAccount;
        }

        // Position popover in center of viewport
        popover.style.top = '50%';
        popover.style.left = '50%';
        popover.style.transform = 'translate(-50%, -50%)';
        popover.classList.remove('hide');

        // Add overlay to capture outside clicks
        this._popoverOverlay = document.createElement('div');
        this._popoverOverlay.className = 'popover-overlay';
        this._popoverOverlay.addEventListener('click', () => this.closePopover());
        document.body.appendChild(this._popoverOverlay);

        // Focus amount
        setTimeout(() => document.getElementById('popoverAmount').focus(), 100);
    }

    closePopover() {
        document.getElementById('actionPopover').classList.add('hide');
        if (this._popoverOverlay) {
            this._popoverOverlay.remove();
            this._popoverOverlay = null;
        }
        this.popoverAction = null;
        this.popoverTargetId = null;
    }

    confirmPopover() {
        const accountId = document.getElementById('popoverAccount').value;
        const amount = parseFloat(document.getElementById('popoverAmount').value);

        if (!accountId) {
            this.showToast('Error', 'Please select an account', 'warning');
            return;
        }
        if (!amount || amount <= 0) {
            this.showToast('Error', 'Enter a valid amount', 'warning');
            return;
        }

        const account = this.accounts.find(a => a.id === accountId);
        if (!account) return;

        if (account.balance < amount) {
            this.showToast('Insufficient Funds', account.name + ' only has ' + this.formatCurrency(account.balance) + '. Please choose another account.', 'warning');
            return;
        }

        if (this.popoverAction === 'payExpense') {
            const expense = this.upcomingExpenses.find(e => e.id === this.popoverTargetId);
            if (!expense) return;

            this.transactions.push({
                id: 'trans_' + Date.now(),
                date: new Date().toISOString().split('T')[0],
                type: 'expense',
                category: expense.category || 'other_expense',
                amount: amount,
                accountId: account.id,
                description: expense.name + (expense.recurring ? ' (recurring)' : ''),
                receipt: null,
                createdAt: new Date().toISOString()
            });
            account.balance -= amount;

            if (expense.recurring) {
                const nextDate = new Date(expense.dueDate);
                nextDate.setMonth(nextDate.getMonth() + 1);
                expense.dueDate = nextDate.toISOString().split('T')[0];
                this.showToast('Paid!', expense.name + ' paid from ' + account.name + '. Next due: ' + new Date(expense.dueDate).toLocaleDateString(), 'success');
            } else {
                this.upcomingExpenses = this.upcomingExpenses.filter(e => e.id !== this.popoverTargetId);
                this.showToast('Paid!', expense.name + ' paid from ' + account.name, 'success');
            }

        } else if (this.popoverAction === 'addMoney') {
            const goal = this.goals.find(g => g.id === this.popoverTargetId);
            if (!goal) return;

            const maxAdd = goal.target - goal.current;
            const actualAmount = Math.min(amount, maxAdd);
            goal.current += actualAmount;
            account.balance -= actualAmount;

            this.transactions.push({
                id: 'trans_' + Date.now(),
                date: new Date().toISOString().split('T')[0],
                type: 'expense',
                category: 'savings',
                amount: actualAmount,
                accountId: account.id,
                description: 'Goal: ' + goal.name,
                receipt: null,
                createdAt: new Date().toISOString()
            });

            if (goal.current >= goal.target) {
                this.showToast('🎉 Goal Reached!', goal.name + ' is fully funded!', 'success');
            } else {
                this.showToast('Success', this.formatCurrency(actualAmount) + ' added to ' + goal.name + ' from ' + account.name, 'success');
            }
        }

        this.saveToStorage();
        this.updateUI();
        this.closePopover();
    }
}

// Initialize
var tracker;
document.addEventListener('DOMContentLoaded', function() {
    tracker = new FinanceTracker();
});
