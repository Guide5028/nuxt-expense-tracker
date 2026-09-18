<script setup>
const expenseStore = useExpensesStore()
const incomeStore = useIncomeStore()

const { categories, expenses, loading: expensesLoading, error: expensesError, totalAmount } = storeToRefs(expenseStore)
const { income, loading: incomeLoading, error: incomeError, totalIncome } = storeToRefs(incomeStore)

const loading = computed(() => expensesLoading.value || incomeLoading.value)
const error = computed(() => expensesError.value || incomeError.value)
const netBalance = computed(() => totalIncome.value - totalAmount.value)

const categoryColors = ['#FBBF24', '#38BDF8', '#C084FC', '#F472B6', '#60A5FA', '#34D399']

const categoryBreakdown = computed(() => {
  const totals = new Map()
  for (const e of expenses.value) {
    totals.set(e.CATEGORY_NAME, (totals.get(e.CATEGORY_NAME) || 0) + Number(e.AMOUNT))
  }
  const entries = [...totals.entries()].sort((a, b) => b[1] - a[1])
  const max = entries[0]?.[1] || 1
  return entries.map(([name, amount], i) => ({
    name,
    amount,
    width: `${(amount / max) * 100}%`,
    color: categoryColors[i % categoryColors.length]
  }))
})

const categoryColorMap = computed(() => {
  const map = {}
  for (const c of categoryBreakdown.value) map[c.name] = c.color
  return map
})

const activity = computed(() => {
  const items = [
    ...expenses.value.map(e => ({
      key: `e-${e.ID}`,
      description: e.DESCRIPTION,
      category: e.CATEGORY_NAME,
      amount: Number(e.AMOUNT),
      sign: -1,
      dotColor: categoryColorMap.value[e.CATEGORY_NAME],
      date: e.SPENT_ON,
      remove: () => expenseStore.deleteExpense(e.ID)
    })),
    ...income.value.map(i => ({
      key: `i-${i.ID}`,
      description: i.DESCRIPTION,
      category: 'Income',
      amount: Number(i.AMOUNT),
      sign: 1,
      dotColor: '#34D399',
      date: i.RECEIVED_ON,
      remove: () => incomeStore.deleteIncome(i.ID)
    }))
  ]
  return items.sort((a, b) => new Date(b.date) - new Date(a.date))
})

const entryType = ref('expense')
const newEntry = ref({
  categoryId: null,
  description: '',
  amount: null
})

onMounted(async () => {
  await Promise.all([
    expenseStore.fetchCategories(),
    expenseStore.fetchExpenses(),
    incomeStore.fetchIncome()
  ])
})

async function submitEntry() {
  if (!newEntry.value.description || !newEntry.value.amount) return
  if (entryType.value === 'expense') {
    if (!newEntry.value.categoryId) return
    await expenseStore.addExpense(newEntry.value)
  } else {
    await incomeStore.addIncome(newEntry.value)
  }
  newEntry.value = { categoryId: null, description: '', amount: null }
}
</script>

<template>
  <div class="page">
    <div class="header">
      <div>
        <h1>Expense Tracker</h1>
        <p class="subtitle">September 2026</p>
      </div>
      <span class="pill">● live sync</span>
    </div>

    <div class="stats">
      <div class="stat-card">
        <div class="stat-label">Total Income</div>
        <div class="stat-value income">+${{ totalIncome.toFixed(2) }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Total Expenses</div>
        <div class="stat-value expense">-${{ totalAmount.toFixed(2) }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Net Balance</div>
        <div class="stat-value" :class="netBalance >= 0 ? 'income' : 'expense'">
          {{ netBalance >= 0 ? '+' : '-' }}${{ Math.abs(netBalance).toFixed(2) }}
        </div>
      </div>
    </div>

    <div class="content">
      <div class="panel form-panel">
        <h2>Add Entry</h2>
        <div class="type-toggle">
          <button type="button" :class="{ active: entryType === 'expense' }" @click="entryType = 'expense'">Expense</button>
          <button type="button" :class="{ active: entryType === 'income' }" @click="entryType = 'income'">Income</button>
        </div>
        <form @submit.prevent="submitEntry">
          <select v-if="entryType === 'expense'" v-model="newEntry.categoryId" aria-label="Category">
            <option :value="null" disabled>Select category</option>
            <option v-for="c in categories" :key="c.ID" :value="c.ID">{{ c.NAME }}</option>
          </select>
          <input v-model="newEntry.description" placeholder="Description" aria-label="Description" />
          <input v-model.number="newEntry.amount" type="number" step="0.01" placeholder="Amount" aria-label="Amount" />
          <button type="submit">{{ entryType === 'expense' ? 'Add Expense' : 'Add Income' }}</button>
        </form>
      </div>

      <div class="panel list-panel">
        <h2>Recent Activity</h2>
        <p v-if="loading" class="muted">Loading...</p>
        <p v-else-if="error" class="muted">{{ error }}</p>
        <p v-else-if="!activity.length" class="muted">No activity yet.</p>
        <ul v-else>
          <li v-for="a in activity" :key="a.key">
            <span class="dot" :style="{ background: a.dotColor }"></span>
            <div class="expense-info">
              <div class="expense-desc">{{ a.description }}</div>
              <div class="expense-category">{{ a.category }}</div>
            </div>
            <div class="expense-amount" :class="a.sign > 0 ? 'income' : 'expense'">
              {{ a.sign > 0 ? '+' : '-' }}${{ a.amount.toFixed(2) }}
            </div>
            <button type="button" class="delete-btn" aria-label="Delete entry" @click="a.remove()">
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M1 1L13 13M13 1L1 13" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
            </button>
          </li>
        </ul>
      </div>

      <div class="panel breakdown-panel">
        <h2>By Category</h2>
        <p v-if="!categoryBreakdown.length" class="muted">No expenses yet.</p>
        <div v-else class="breakdown-row" v-for="c in categoryBreakdown" :key="c.name">
          <div class="breakdown-label">
            <span>{{ c.name }}</span>
            <span class="breakdown-amount">${{ c.amount.toFixed(2) }}</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill" :style="{ width: c.width, background: c.color }"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.page {
  max-width: 1000px;
  margin: 40px auto;
  font-family: 'IBM Plex Sans', sans-serif;
  background: #12141A;
  color: #E5E7EB;
  padding: 24px;
  border-radius: 12px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.subtitle {
  color: #8B90A0;
  font-size: 0.9em;
}

.pill {
  padding: 8px 16px;
  border-radius: 8px;
  background: #1B1E27;
  border: 1px solid #2A2E3A;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.8em;
  color: #34D399;
}

.stats {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.stat-card {
  flex: 1;
  background: #1B1E27;
  border: 1px solid #2A2E3A;
  border-radius: 12px;
  padding: 16px;
}

.stat-label {
  font-size: 0.75em;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #8B90A0;
  margin-bottom: 6px;
}

.stat-value {
  font-family: 'IBM Plex Mono', monospace;
  font-weight: 600;
  font-size: 1.4em;
}

.income {
  color: #34D399;
}

.expense {
  color: #F87171;
}

.content {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.panel {
  background: #1B1E27;
  border: 1px solid #2A2E3A;
  border-radius: 12px;
  padding: 20px;
}

.panel h2 {
  margin: 0 0 16px;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.95em;
  font-weight: 600;
}

.form-panel {
  width: 260px;
}

.type-toggle {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.type-toggle button {
  flex: 1;
  padding: 8px;
  border: 1px solid #2A2E3A;
  border-radius: 8px;
  background: #12141A;
  color: #8B90A0;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 0.85em;
  cursor: pointer;
}

.type-toggle button.active {
  background: #2A2E3A;
  color: #E5E7EB;
  border-color: #34D399;
}

.list-panel {
  flex: 1;
  min-width: 320px;
}

.breakdown-panel {
  width: 260px;
  display: flex;
  flex-direction: column;
}

.muted {
  color: #8B90A0;
  font-size: 0.85em;
}

form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

select, input {
  padding: 11px 12px;
  border: 1px solid #2A2E3A;
  border-radius: 8px;
  background: #12141A;
  color: #E5E7EB;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 0.9em;
}

button[type="submit"] {
  padding: 11px 20px;
  border: none;
  border-radius: 8px;
  background: #34D399;
  color: #0B1210;
  font-family: 'IBM Plex Mono', monospace;
  font-weight: 600;
  cursor: pointer;
}

ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

li {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-top: 1px solid #2A2E3A;
}

li:first-child {
  border-top: none;
  padding-top: 0;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.expense-info {
  flex: 1;
  min-width: 0;
}

.expense-desc {
  font-size: 0.9em;
  font-weight: 500;
}

.expense-category {
  font-size: 0.75em;
  color: #8B90A0;
  margin-top: 2px;
}

.expense-amount {
  font-family: 'IBM Plex Mono', monospace;
  font-weight: 600;
  font-size: 0.9em;
  white-space: nowrap;
}

.delete-btn {
  width: 22px;
  height: 22px;
  border: none;
  background: transparent;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4A4F5C;
  cursor: pointer;
  flex-shrink: 0;
}

.breakdown-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 14px;
}

.breakdown-row:last-child {
  margin-bottom: 0;
}

.breakdown-label {
  display: flex;
  justify-content: space-between;
  font-size: 0.8em;
}

.breakdown-amount {
  font-family: 'IBM Plex Mono', monospace;
  color: #8B90A0;
}

.bar-track {
  width: 100%;
  height: 8px;
  border-radius: 999px;
  background: #12141A;
}

.bar-fill {
  height: 8px;
  border-radius: 999px;
}
</style>
