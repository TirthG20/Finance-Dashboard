document.addEventListener('DOMContentLoaded', () => {
  const descriptionInput = document.getElementById('descriptionInput');
  const amountInput = document.getElementById('amountInput');
  const typeSelect = document.getElementById('typeSelect');
  const categorySelect = document.getElementById('categorySelect');
  const dateInput = document.getElementById('dateInput');
  const addTransactionBtn = document.getElementById('addTransactionBtn');
  const goalInput = document.getElementById('goalInput');
  const setGoalBtn = document.getElementById('setGoalBtn');
  const goalProgress = document.getElementById('goalProgress');
  const totalIncome = document.getElementById('totalIncome');
  const totalExpenses = document.getElementById('totalExpenses');
  const totalBalance = document.getElementById('totalBalance');
  const transactionList = document.getElementById('transactionList');
  const toggleDarkMode = document.getElementById('toggleDarkMode');
  const spendingChartCanvas = document.getElementById('spendingChart');
  const balanceChartCanvas = document.getElementById('balanceChart');
  const openSidebar = document.getElementById('openSidebar');
  const closeSidebar = document.getElementById('closeSidebar');
  const sidebar = document.getElementById('sidebar');

  let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
  let savingsGoal = JSON.parse(localStorage.getItem('savingsGoal')) || 0;
  let spendingChart, balanceChart;

  // Sidebar toggle
  openSidebar.addEventListener('click', () => {
    sidebar.classList.remove('-translate-x-full');
  });
  closeSidebar.addEventListener('click', () => {
    sidebar.classList.add('-translate-x-full');
  });

  // Initialize charts
  function initCharts() {
    spendingChart = new Chart(spendingChartCanvas, {
      type: 'pie',
      data: {
        labels: ['Food', 'Rent', 'Salary', 'Utilities', 'Entertainment', 'Other'],
        datasets: [{
          data: [0, 0, 0, 0, 0, 0],
          backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#C9CBCF']
        }]
      },
      options: { responsive: true, plugins: { title: { display: true, text: 'Spending by Category' } } }
    });
    balanceChart = new Chart(balanceChartCanvas, {
      type: 'bar',
      data: {
        labels: ['Income', 'Expenses', 'Balance'],
        datasets: [{
          data: [0, 0, 0],
          backgroundColor: ['#36A2EB', '#FF6384', '#FFCE56']
        }]
      },
      options: { responsive: true, plugins: { title: { display: true, text: 'Monthly Balance' } } }
    });
  }

  // Render transactions
  function renderTransactions() {
    transactionList.innerHTML = '';
    transactions.forEach((transaction, index) => {
      const li = document.createElement('li');
      li.className = `transaction-item flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 animate-fade-in`;
      li.innerHTML = `
        <div class="flex items-center space-x-3">
          <span class="material-icons text-teal-600 dark:text-teal-400">
            ${transaction.type === 'income' ? 'arrow_upward' : 'arrow_downward'}
          </span>
          <div>
            <p class="font-medium">${transaction.description}</p>
            <span class="text-xs text-gray-500 dark:text-gray-400">${transaction.category} - ${transaction.date}</span>
          </div>
        </div>
        <div class="flex items-center space-x-2">
          <span class="text-sm font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}">
            ${transaction.type === 'income' ? '+' : '-'}$${transaction.amount.toFixed(2)}
          </span>
          <button onclick="editTransaction(${index})" class="text-blue-500 hover:text-blue-700">
            <span class="material-icons text-sm">edit</span>
          </button>
          <button onclick="deleteTransaction(${index})" class="text-red-500 hover:text-red-700">
            <span class="material-icons text-sm">delete</span>
          </button>
        </div>
      `;
      transactionList.appendChild(li);
    });
    updateSummary();
    updateCharts();
    updateGoalProgress();
    saveData();
  }

  // Update summary
  function updateSummary() {
    const income = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    const balance = income - expenses;
    totalIncome.textContent = income.toFixed(2);
    totalExpenses.textContent = expenses.toFixed(2);
    totalBalance.textContent = balance.toFixed(2);
  }

  // Update charts
  function updateCharts() {
    const categorySpending = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount;
        return acc;
      }, {});
    const spendingData = ['Food', 'Rent', 'Salary', 'Utilities', 'Entertainment', 'Other']
      .map(cat => categorySpending[cat] || 0);
    spendingChart.data.datasets[0].data = spendingData;
    spendingChart.update();

    const income = parseFloat(totalIncome.textContent);
    const expenses = parseFloat(totalExpenses.textContent);
    const balance = parseFloat(totalBalance.textContent);
    balanceChart.data.datasets[0].data = [income, expenses, balance];
    balanceChart.update();
  }

  // Update savings goal progress
  function updateGoalProgress() {
    const balance = parseFloat(totalBalance.textContent);
    if (savingsGoal > 0) {
      const progress = (balance / savingsGoal) * 100;
      goalProgress.textContent = `Progress: ₹${balance.toFixed(2)} / ₹${savingsGoal.toFixed(2)} (${progress.toFixed(1)}%)`;
    } else {
      goalProgress.textContent = 'Set a savings goal to track progress.';
    }
  }

  // Save data
  function saveData() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
    localStorage.setItem('savingsGoal', JSON.stringify(savingsGoal));
  }

  // Add transaction
  addTransactionBtn.addEventListener('click', () => {
    const description = descriptionInput.value.trim();
    const amount = parseFloat(amountInput.value);
    const type = typeSelect.value;
    const category = categorySelect.value;
    const date = dateInput.value || new Date().toISOString().split('T')[0];
    if (description && !isNaN(amount) && amount > 0) {
      transactions.push({ description, amount, type, category, date });
      descriptionInput.value = '';
      amountInput.value = '';
      dateInput.value = '';
      renderTransactions();
    }
  });

  // Edit transaction
  window.editTransaction = function(index) {
    const newDescription = prompt('Edit description:', transactions[index].description);
    const newAmount = prompt('Edit amount:', transactions[index].amount);
    const newType = prompt('Edit type (income/expense):', transactions[index].type);
    const newCategory = prompt('Edit category:', transactions[index].category);
    const newDate = prompt('Edit date (YYYY-MM-DD):', transactions[index].date);
    if (newDescription && !isNaN(parseFloat(newAmount)) && parseFloat(newAmount) > 0) {
      transactions[index] = {
        description: newDescription.trim(),
        amount: parseFloat(newAmount),
        type: ['income', 'expense'].includes(newType) ? newType : transactions[index].type,
        category: ['Food', 'Rent', 'Salary', 'Utilities', 'Entertainment', 'Other'].includes(newCategory) ? newCategory : transactions[index].category,
        date: newDate || transactions[index].date
      };
      renderTransactions();
    }
  };

  // Delete transaction
  window.deleteTransaction = function(index) {
    transactions.splice(index, 1);
    renderTransactions();
  };

  // Set savings goal
  setGoalBtn.addEventListener('click', () => {
    const goal = parseFloat(goalInput.value);
    if (!isNaN(goal) && goal >= 0) {
      savingsGoal = goal;
      goalInput.value = '';
      updateGoalProgress();
      saveData();
    }
  });

  // Initialize
  initCharts();
  renderTransactions();
});