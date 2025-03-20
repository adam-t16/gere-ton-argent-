// State management with validation and error handling
const state = {
  balance: 0,
  bankBalance: 0,
  savings: 0,
  transactions: [],
  dailyTarget: 15,
  dailyAllowance: 20,
  savingsGoal: 10000,
  darkMode: false,
  monthlyExpenses: {
    food: 0,
    transport: 0,
    leisure: 0,
    other: 0
  }
};

// Validation utilities
const validators = {
  amount: (value) => {
    const amount = parseFloat(value);
    return !isNaN(amount) && amount > 0 && amount <= 1000000;
  },
  
  transaction: ({ type, amount, category }) => {
    return type && validators.amount(amount) && category;
  }
};

// Error handling
const showError = (message) => {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  document.body.appendChild(errorDiv);
  setTimeout(() => errorDiv.remove(), 3000);
};

// Format currency
const formatCurrency = (amount) => {
  return amount.toLocaleString('fr-MA', {
    style: 'currency',
    currency: 'MAD',
    minimumFractionDigits: 2
  });
};

// Load data from localStorage with validation
function loadData() {
  try {
    const savedData = localStorage.getItem('financeData');
    if (savedData) {
      const data = JSON.parse(savedData);
      // Validate data before merging
      if (typeof data.balance === 'number' && typeof data.bankBalance === 'number') {
        Object.assign(state, data);
      }
    }
    updateUI();
    calculateMonthlyExpenses();
  } catch (error) {
    showError('Error loading data');
    console.error('Load data error:', error);
  }
}

// Save data with error handling
function saveData() {
  try {
    localStorage.setItem('financeData', JSON.stringify(state));
  } catch (error) {
    showError('Error saving data');
    console.error('Save data error:', error);
  }
}

// Calculate monthly expenses with date validation
function calculateMonthlyExpenses() {
  try {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Reset monthly expenses
    Object.keys(state.monthlyExpenses).forEach(key => {
      state.monthlyExpenses[key] = 0;
    });
    
    // Calculate expenses for current month
    state.transactions
      .filter(t => t.type === 'expense' && new Date(t.date) >= firstDayOfMonth)
      .forEach(t => {
        if (state.monthlyExpenses.hasOwnProperty(t.category)) {
          state.monthlyExpenses[t.category] += t.amount;
        } else {
          state.monthlyExpenses.other += t.amount;
        }
      });

    updateMonthlyExpensesUI();
  } catch (error) {
    showError('Error calculating expenses');
    console.error('Calculate expenses error:', error);
  }
}

// Update monthly expenses UI
function updateMonthlyExpensesUI() {
  const monthlyExpensesList = document.getElementById('monthlyExpensesList');
  if (!monthlyExpensesList) return;
  
  monthlyExpensesList.innerHTML = '';
  
  Object.entries(state.monthlyExpenses).forEach(([category, amount]) => {
    const item = document.createElement('div');
    item.className = 'expense-item';
    item.innerHTML = `
      <span class="category">${category}</span>
      <span class="amount">${formatCurrency(amount)}</span>
    `;
    monthlyExpensesList.appendChild(item);
  });
}

// Update transactions list UI
function updateTransactionsList() {
  try {
    const transactionsList = document.getElementById('transactionsList');
    if (!transactionsList) return;
    
    transactionsList.innerHTML = '';
    
    // Sort transactions by date, most recent first
    const sortedTransactions = [...state.transactions].sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    );
    
    sortedTransactions.forEach(transaction => {
      const item = document.createElement('div');
      item.className = 'transaction-item';
      item.innerHTML = `
        <div>
          <strong>${transaction.category}</strong>
          <span>${new Date(transaction.date).toLocaleDateString('fr-MA')}</span>
        </div>
        <div>
          <span class="${transaction.type === 'income' ? 'text-success' : 'text-error'}">
            ${transaction.type === 'income' ? '+' : '-'} ${formatCurrency(transaction.amount)}
          </span>
          <button class="btn" onclick="deleteTransaction('${transaction.id}')">❌</button>
        </div>
      `;
      transactionsList.appendChild(item);
    });
  } catch (error) {
    showError('Error updating transactions list');
    console.error('Update transactions list error:', error);
  }
}

// Update UI elements with error handling
function updateUI() {
  try {
    const elements = {
      totalBalance: document.getElementById('totalBalance'),
      bankBalance: document.getElementById('bankBalance'),
      currentSavings: document.getElementById('currentSavings'),
      dailyDeposit: document.getElementById('dailyDeposit'),
      dailyAllowance: document.getElementById('dailyAllowance'),
      savingsProgress: document.getElementById('savingsProgress')
    };

    // Validate elements exist before updating
    if (Object.values(elements).some(el => !el)) {
      throw new Error('Required UI elements not found');
    }

    elements.totalBalance.textContent = formatCurrency(state.balance);
    elements.bankBalance.textContent = formatCurrency(state.bankBalance);
    elements.currentSavings.textContent = formatCurrency(state.savings);
    elements.dailyDeposit.textContent = formatCurrency(state.dailyTarget);
    elements.dailyAllowance.textContent = formatCurrency(state.dailyAllowance);
    
    // Update savings progress
    const progress = Math.min((state.savings / state.savingsGoal) * 100, 100);
    elements.savingsProgress.style.width = `${progress}%`;
    
    updateTransactionsList();
    updateChart();
    calculateMonthlyExpenses();
  } catch (error) {
    showError('Error updating UI');
    console.error('Update UI error:', error);
  }
}

// Initialize Chart.js with error handling
let savingsChart;
function initChart() {
  try {
    const ctx = document.getElementById('savingsChart')?.getContext('2d');
    if (!ctx) return;

    savingsChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: 'Épargne',
          data: [],
          borderColor: '#646cff',
          tension: 0.4,
          fill: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          },
          title: {
            display: true,
            text: 'Progression de l\'épargne'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: value => formatCurrency(value)
            }
          }
        }
      }
    });
  } catch (error) {
    showError('Error initializing chart');
    console.error('Chart init error:', error);
  }
}

// Update chart data with validation
function updateChart() {
  try {
    if (!savingsChart) return;
    
    const savingsData = state.transactions
      .filter(t => t.type === 'savings')
      .map(t => ({
        date: new Date(t.date),
        amount: t.amount
      }))
      .sort((a, b) => a.date - b.date);

    savingsChart.data.labels = savingsData.map(d => 
      d.date.toLocaleDateString('fr-MA')
    );
    savingsChart.data.datasets[0].data = savingsData.map(d => d.amount);
    savingsChart.update();
  } catch (error) {
    showError('Error updating chart');
    console.error('Chart update error:', error);
  }
}

// Handle bank transfer with validation
function handleBankTransfer(e) {
  e.preventDefault();
  
  try {
    const amount = parseFloat(document.getElementById('bankAmount').value);
    const transferType = document.getElementById('transferType').value;
    
    if (!validators.amount(amount)) {
      showError('Invalid amount');
      return;
    }
    
    if (transferType === 'deposit' && amount > state.balance) {
      showError('Insufficient balance');
      return;
    }
    
    if (transferType === 'withdraw' && amount > state.bankBalance) {
      showError('Insufficient bank balance');
      return;
    }
    
    if (transferType === 'deposit') {
      state.bankBalance += amount;
      state.balance -= amount;
    } else {
      state.bankBalance -= amount;
      state.balance += amount;
    }
    
    const transaction = {
      id: Date.now().toString(),
      type: transferType === 'deposit' ? 'expense' : 'income',
      amount,
      category: 'bank_transfer',
      date: new Date().toISOString()
    };
    
    state.transactions.push(transaction);
    saveData();
    updateUI();
    e.target.reset();
  } catch (error) {
    showError('Error processing transfer');
    console.error('Transfer error:', error);
  }
}

// Handle settings update with validation
function handleSettingsUpdate(e) {
  e.preventDefault();
  
  try {
    const dailyAllowance = parseFloat(document.getElementById('settingsAllowance').value);
    const dailyTarget = parseFloat(document.getElementById('settingsSavings').value);
    
    if (validators.amount(dailyAllowance)) {
      state.dailyAllowance = dailyAllowance;
    }
    
    if (validators.amount(dailyTarget)) {
      state.dailyTarget = dailyTarget;
    }
    
    saveData();
    updateUI();
    e.target.reset();
  } catch (error) {
    showError('Error updating settings');
    console.error('Settings update error:', error);
  }
}

// Handle new transaction with validation
function handleTransaction(e) {
  e.preventDefault();
  
  try {
    const type = document.getElementById('transactionType').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const category = document.getElementById('category').value;
    
    if (!validators.transaction({ type, amount, category })) {
      showError('Invalid transaction data');
      return;
    }
    
    if (type === 'expense' && amount > state.balance) {
      showError('Insufficient balance');
      return;
    }
    
    const transaction = {
      id: Date.now().toString(),
      type,
      amount,
      category,
      date: new Date().toISOString()
    };
    
    state.transactions.push(transaction);
    state.balance += type === 'income' ? amount : -amount;
    
    saveData();
    updateUI();
    e.target.reset();
  } catch (error) {
    showError('Error processing transaction');
    console.error('Transaction error:', error);
  }
}

// Handle daily deposit with validation
function handleDeposit() {
  try {
    if (state.balance < state.dailyTarget) {
      showError('Insufficient balance for daily deposit');
      return;
    }
    
    const deposit = {
      id: Date.now().toString(),
      type: 'savings',
      amount: state.dailyTarget,
      category: 'deposit',
      date: new Date().toISOString()
    };
    
    state.transactions.push(deposit);
    state.savings += state.dailyTarget;
    state.balance -= state.dailyTarget;
    
    saveData();
    updateUI();
  } catch (error) {
    showError('Error processing deposit');
    console.error('Deposit error:', error);
  }
}

// Delete transaction with confirmation
window.deleteTransaction = function(id) {
  try {
    if (!confirm('Are you sure you want to delete this transaction?')) {
      return;
    }
    
    const index = state.transactions.findIndex(t => t.id === id);
    if (index === -1) return;
    
    const transaction = state.transactions[index];
    
    if (transaction.type === 'savings') {
      state.savings -= transaction.amount;
    } else {
      state.balance += transaction.type === 'income' ? -transaction.amount : transaction.amount;
    }
    
    state.transactions.splice(index, 1);
    saveData();
    updateUI();
  } catch (error) {
    showError('Error deleting transaction');
    console.error('Delete error:', error);
  }
};

// Toggle dark mode
function toggleDarkMode() {
  try {
    state.darkMode = !state.darkMode;
    document.documentElement.setAttribute('data-theme', state.darkMode ? 'dark' : 'light');
    document.getElementById('darkModeToggle').textContent = state.darkMode ? '☀️' : '🌙';
    saveData();
  } catch (error) {
    showError('Error toggling theme');
    console.error('Theme toggle error:', error);
  }
}

// Export data to CSV
function exportToCSV() {
  try {
    const headers = ['Date', 'Type', 'Category', 'Amount'];
    const rows = state.transactions.map(t => [
      new Date(t.date).toLocaleDateString(),
      t.type,
      t.category,
      t.amount
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `finances_${new Date().toISOString().split('T')[0]}.csv`);
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    showError('Error exporting data');
    console.error('Export error:', error);
  }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  try {
    loadData();
    initChart();
    
    // Event listeners
    document.getElementById('transactionForm')?.addEventListener('submit', handleTransaction);
    document.getElementById('bankForm')?.addEventListener('submit', handleBankTransfer);
    document.getElementById('settingsForm')?.addEventListener('submit', handleSettingsUpdate);
    document.getElementById('markDeposit')?.addEventListener('click', handleDeposit);
    document.getElementById('darkModeToggle')?.addEventListener('click', toggleDarkMode);
    document.getElementById('exportData')?.addEventListener('click', exportToCSV);
    
    // Set initial theme
    if (state.darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.getElementById('darkModeToggle').textContent = '☀️';
    }
  } catch (error) {
    showError('Error initializing app');
    console.error('Init error:', error);
  }
});