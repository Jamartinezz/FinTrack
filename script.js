// Initialize date input with current date
document.addEventListener('DOMContentLoaded', function() {
    const dateInput = document.getElementById('date');
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    dateInput.value = formattedDate;
    
    loadTransactions();
    updateCurrentMonthDisplay();
});

// Current view month/year
let currentViewMonth = new Date().getMonth();
let currentViewYear = new Date().getFullYear();

// Update the month display
function updateCurrentMonthDisplay() {
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    document.getElementById('current-month-display').textContent = `${monthNames[currentViewMonth]} ${currentViewYear}`;
    loadTransactions();
}

// Navigate to previous month
document.getElementById('prev-month').addEventListener('click', function() {
    currentViewMonth--;
    if (currentViewMonth < 0) {
        currentViewMonth = 11;
        currentViewYear--;
    }
    updateCurrentMonthDisplay();
});

// Navigate to next month
document.getElementById('next-month').addEventListener('click', function() {
    currentViewMonth++;
    if (currentViewMonth > 11) {
        currentViewMonth = 0;
        currentViewYear++;
    }
    updateCurrentMonthDisplay();
});

// Handle adding a new transaction
document.getElementById('add-transaction').addEventListener('click', function() {
    const description = document.getElementById('description').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const type = document.getElementById('type').value;
    const category = document.getElementById('category').value;
    const date = document.getElementById('date').value;
    
    if (description === '' || isNaN(amount) || amount <= 0 || date === '') {
        alert('Please fill all fields with valid values');
        return;
    }
    
    const transaction = {
        id: generateID(),
        description,
        amount,
        type,
        category,
        date
    };
    
    saveTransaction(transaction);
    
    // Clear form
    document.getElementById('description').value = '';
    document.getElementById('amount').value = '';
    document.getElementById('type').selectedIndex = 0;
    document.getElementById('category').selectedIndex = 0;
    
    loadTransactions();
});

// Generate a unique ID for transactions
function generateID() {
    return Math.floor(Math.random() * 1000000) + Date.now();
}

// Save transaction to local storage
function saveTransaction(transaction) {
    let transactions = getTransactionsFromStorage();
    transactions.push(transaction);
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Delete transaction from local storage
function deleteTransaction(id) {
    let transactions = getTransactionsFromStorage();
    transactions = transactions.filter(transaction => transaction.id !== id);
    localStorage.setItem('transactions', JSON.stringify(transactions));
    loadTransactions();
}

// Get transactions from local storage
function getTransactionsFromStorage() {
    let transactions;
    if (localStorage.getItem('transactions') === null) {
        transactions = [];
    } else {
        transactions = JSON.parse(localStorage.getItem('transactions'));
    }
    return transactions;
}

// Load and display transactions
function loadTransactions() {
    const transactionsList = document.getElementById('transactions-list');
    const noTransactions = document.getElementById('no-transactions');
    const transactions = getTransactionsFromStorage();
    
    // Filter transactions for current month view
    const filteredTransactions = transactions.filter(transaction => {
        const transactionDate = new Date(transaction.date);
        return transactionDate.getMonth() === currentViewMonth && 
               transactionDate.getFullYear() === currentViewYear;
    });
    
    // Clear transactions list
    transactionsList.innerHTML = '';
    
    if (filteredTransactions.length === 0) {
        noTransactions.style.display = 'block';
    } else {
        noTransactions.style.display = 'none';
        
        // Sort transactions by date (newest first)
        filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        filteredTransactions.forEach(transaction => {
            const row = document.createElement('tr');
            row.className = transaction.type === 'income' ? 'category-income' : 'category-expense';
            
            const formattedDate = new Date(transaction.date).toLocaleDateString();
            const amountClass = transaction.type === 'income' ? 'income' : 'expense';
            const amountPrefix = transaction.type === 'income' ? '+' : '-';
            
            row.innerHTML = `
                <td>${formattedDate}</td>
                <td>${transaction.description}</td>
                <td>${transaction.category}</td>
                <td class="${amountClass}">${amountPrefix}$${transaction.amount.toFixed(2)}</td>
                <td><button class="action-btn" data-id="${transaction.id}">Delete</button></td>
            `;
            
            transactionsList.appendChild(row);
        });
        
        // Add event listeners to delete buttons
        document.querySelectorAll('.action-btn').forEach(button => {
            button.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                deleteTransaction(id);
            });
        });
    }
    
    updateSummary(filteredTransactions);
}

// Update the summary section
function updateSummary(transactions) {
    const totalIncome = transactions
        .filter(transaction => transaction.type === 'income')
        .reduce((total, transaction) => total + transaction.amount, 0);
        
    const totalExpense = transactions
        .filter(transaction => transaction.type === 'expense')
        .reduce((total, transaction) => total + transaction.amount, 0);
        
    const balance = totalIncome - totalExpense;
    
    // Update totals
    document.getElementById('total-income').textContent = `$${totalIncome.toFixed(2)}`;
    document.getElementById('total-expense').textContent = `$${totalExpense.toFixed(2)}`;
    document.getElementById('total-balance').textContent = `$${balance.toFixed(2)}`;
    
    // Update category summary
    const categorySummary = document.getElementById('category-summary');
    categorySummary.innerHTML = '';
    
    // Group expenses by category
    const categoryTotals = {};
    
    transactions.forEach(transaction => {
        if (transaction.type === 'expense') {
            if (!categoryTotals[transaction.category]) {
                categoryTotals[transaction.category] = 0;
            }
            categoryTotals[transaction.category] += transaction.amount;
        }
    });
    
    // Create summary items
    for (const category in categoryTotals) {
        const summaryItem = document.createElement('div');
        summaryItem.className = 'summary-item';
        summaryItem.innerHTML = `
            <div>${category.charAt(0).toUpperCase() + category.slice(1)}</div>
            <div>$${categoryTotals[category].toFixed(2)}</div>
        `;
        categorySummary.appendChild(summaryItem);
    }
}