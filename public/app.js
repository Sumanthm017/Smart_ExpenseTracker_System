const API_URL = "http://localhost:5000";

const authSection = document.getElementById("auth-section");
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const dashboard = document.getElementById("dashboard");
const expensesUl = document.getElementById("expenses-ul");
const budgetList = document.getElementById("budget-list");

function showLogin() {
    loginForm.style.display = "block";
    registerForm.style.display = "none";
}

function showRegister() {
    loginForm.style.display = "none";
    registerForm.style.display = "block";
}

async function register() {
    const username = document.getElementById("reg-username").value;
    const password = document.getElementById("reg-password").value;

    try {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (res.ok) {
            alert("Registration successful! Please login.");
            showLogin();
        } else {
            alert(data.error);
        }
    } catch (err) {
        alert("Error registering");
    }
}

async function login() {
    const username = document.getElementById("login-username").value;
    const password = document.getElementById("login-password").value;

    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (res.ok) {
            localStorage.setItem("token", data.token);
            localStorage.setItem("username", username);
            showDashboard();
        } else {
            alert(data.error);
        }
    } catch (err) {
        alert("Error logging in");
    }
}

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    authSection.style.display = "block";
    dashboard.style.display = "none";
}

function showDashboard() {
    const token = localStorage.getItem("token");
    if (!token) {
        authSection.style.display = "block";
        dashboard.style.display = "none";
        return;
    }

    authSection.style.display = "none";
    dashboard.style.display = "block";
    document.getElementById("username-display").innerText = localStorage.getItem("username");
    fetchExpenses();
    fetchBudgets();
}

let expenseChart, incomeExpenseChart, cashFlowChart;

async function fetchExpenses() {
    const token = localStorage.getItem("token");
    if (!token) return;

    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;

    let url = `${API_URL}/expenses?`;
    if (startDate) url += `startDate=${startDate}&`;
    if (endDate) url += `endDate=${endDate}`;

    try {
        const res = await fetch(url, { headers: { "Authorization": token } });
        const expenses = await res.json();

        // Render List
        expensesUl.innerHTML = "";
        expenses.forEach(exp => {
            const li = document.createElement("li");
            li.classList.add(exp.type === 'income' ? 'income-item' : 'expense-item');

            li.innerHTML = `
                <span><b>${exp.title}</b> - $${exp.amount} (${exp.category}) - ${new Date(exp.date).toLocaleDateString()}</span>
                <div class="actions">
                    <button class="edit-btn" onclick="openEditModal('${exp._id}', '${exp.title}', ${exp.amount}, '${exp.category}')">Edit</button>
                    <button class="delete-btn" onclick="deleteExpense('${exp._id}')">Delete</button>
                </div>
            `;
            expensesUl.appendChild(li);
        });

        // Render Charts
        renderCharts(expenses);

    } catch (err) {
        console.error("Error fetching expenses", err);
    }
}

async function fetchBudgets() {
    const token = localStorage.getItem("token");
    const month = new Date().toISOString().slice(0, 7); // YYYY-MM

    try {
        const res = await fetch(`${API_URL}/budgets?month=${month}`, { headers: { "Authorization": token } });
        const budgets = await res.json();

        budgetList.innerHTML = "";
        budgets.forEach(b => {
            const ratio = b.spent / b.amount;
            const percent = Math.min(ratio * 100, 100);
            let colorClass = "";
            if (ratio > 1) {
                showToast(`⚠️ Budget exceeded for ${b.category}!`, "danger");
                colorClass = "danger";
            } else if (ratio > 0.8) {
                showToast(`⚠️ Close to budget limit for ${b.category}`, "warning");
                colorClass = "warning";
            }

            const div = document.createElement("div");
            div.className = "budget-item";
            div.innerHTML = `
                <div style="display:flex; justify-content:space-between">
                    <span>${b.category}</span>
                    <span>$${b.spent} / $${b.amount}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill ${colorClass}" style="width: ${percent}%"></div>
                </div>
            `;
            budgetList.appendChild(div);
        });
    } catch (err) {
        console.error("Error fetching budgets", err);
    }
}

async function setBudget() {
    const category = document.getElementById("budget-category").value;
    const amount = document.getElementById("budget-amount").value;
    const token = localStorage.getItem("token");
    const month = new Date().toISOString().slice(0, 7);

    if (!category || !amount) return alert("Fill all fields");

    await fetch(`${API_URL}/budgets`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": token },
        body: JSON.stringify({ category, amount, month })
    });

    document.getElementById("budget-category").value = "";
    document.getElementById("budget-amount").value = "";
    fetchBudgets();
}

async function addTransaction() {
    const title = document.getElementById("expense-title").value;
    const amount = document.getElementById("expense-amount").value;
    const category = document.getElementById("expense-category").value;
    const type = document.querySelector('input[name="trans-type"]:checked').value;
    const isRecurring = document.getElementById("is-recurring").checked;
    const token = localStorage.getItem("token");

    if (!title || !amount || !category) return alert("Fill all fields");

    // Add Transaction
    const res = await fetch(`${API_URL}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": token },
        body: JSON.stringify({ title, amount, category, type })
    });

    // Add Recurring if checked
    if (res.ok && isRecurring) {
        await fetch(`${API_URL}/recurring`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": token },
            body: JSON.stringify({ title, amount, category, type, frequency: "monthly" })
        });
        alert("Transaction added & Recurring setup!");
    }

    if (res.ok) {
        document.getElementById("expense-title").value = "";
        document.getElementById("expense-amount").value = "";
        document.getElementById("expense-category").value = "";
        fetchExpenses();
        fetchBudgets();
    } else {
        alert("Error adding transaction");
    }
}

async function deleteExpense(id) {
    if (!confirm("Are you sure?")) return;
    const token = localStorage.getItem("token");
    await fetch(`${API_URL}/expenses/${id}`, { method: "DELETE", headers: { "Authorization": token } });
    fetchExpenses();
    fetchBudgets();
}

function renderCharts(transactions) {
    const expenses = transactions.filter(t => t.type === 'expense');
    const income = transactions.filter(t => t.type === 'income');

    // 1. Expense by Category (Pie)
    if (expenses.length === 0) {
        // Handle empty state or just clear chart
        if (expenseChart) expenseChart.destroy();
        return;
    }

    const categoryTotals = {};
    expenses.forEach(exp => {
        categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
    });

    const ctx1 = document.getElementById('expenseChart');
    if (ctx1) {
        if (expenseChart) expenseChart.destroy();
        expenseChart = new Chart(ctx1.getContext('2d'), {
            type: 'pie',
            data: {
                labels: Object.keys(categoryTotals),
                datasets: [{
                    data: Object.values(categoryTotals),
                    backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: 'Expenses by Category' }
                }
            }
        });
    }

    // 2. Income vs Expense (Bar)
    const totalIncome = income.reduce((sum, item) => sum + item.amount, 0);
    const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0);

    // Alert if expenses exceed income
    if (totalExpense > totalIncome) {
        showToast("⚠️ Warning: Expenses have exceeded your Income!", "danger");
    }

    const ctx2 = document.getElementById('incomeExpenseChart');
    if (ctx2) {
        if (incomeExpenseChart) incomeExpenseChart.destroy();
        incomeExpenseChart = new Chart(ctx2.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Income', 'Expenses'],
                datasets: [{
                    label: 'Amount ($)',
                    data: [totalIncome, totalExpense],
                    backgroundColor: ['#4CAF50', '#F44336']
                }]
            },
            options: {
                scales: { y: { beginAtZero: true } },
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    // 3. Cash Flow (Income vs Expense Pie)
    const ctx3 = document.getElementById('cashFlowChart');
    if (ctx3) {
        // Calculate Savings (only if positive)
        const savings = totalIncome > totalExpense ? totalIncome - totalExpense : 0;

        let cfData, cfLabels, cfColors;
        if (totalIncome === 0 && totalExpense === 0) {
            // Emtpy state
            cfData = [1]; cfLabels = ["No Data"]; cfColors = ["#e0e0e0"];
        } else {
            cfData = [totalExpense, savings];
            cfLabels = ["Expenses", "Savings"];
            cfColors = ["#F44336", "#4CAF50"];
        }

        if (cashFlowChart) cashFlowChart.destroy();
        cashFlowChart = new Chart(ctx3.getContext('2d'), {
            type: 'pie',
            data: {
                labels: cfLabels,
                datasets: [{
                    data: cfData,
                    backgroundColor: cfColors
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: 'Salary Utilization' }
                }
            }
        });
    }
}

// Toast Notification
function showToast(message, type = "") {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerText = message;

    container.appendChild(toast);

    // Trigger animation
    setTimeout(() => toast.classList.add("show"), 10);

    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Check login status on load
showDashboard();
