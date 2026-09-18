<script setup>
const store = useExpensesStore()
const { categories, expenses, loading, error, totalAmount } = storeToRefs(store)
const transactionCount = computed(() => expenses.value.length)
const dailyAverage = computed(() => totalAmount.value / 30)

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

const newExpense = ref({
  categoryId: null,
  description: '',
  amount: null
})

onMounted(async () => {
  await Promise.all([store.fetchCategories(), store.fetchExpenses()])
})

async function submitExpense() {
  if (!newExpense.value.categoryId || !newExpense.value.description || !newExpense.value.amount) return
  await store.addExpense(newExpense.value)
  newExpense.value = { categoryId: null, description: '', amount: null }
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
        <div class="stat-label">Total Spent</div>
        <div class="stat-value accent">${{ totalAmount.toFixed(2) }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Transactions</div>
        <div class="stat-value">{{ transactionCount }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Daily Average</div>
        <div class="stat-value accent">${{ dailyAverage.toFixed(2) }}</div>
      </div>
    </div>

    <div class="content">
      <div class="panel form-panel">
        <h2>Add Expense</h2>
        <form @submit.prevent="submitExpense">
          <select v-model="newExpense.categoryId" aria-label="Category">
            <option :value="null" disabled>Select category</option>
            <option v-for="c in categories" :key="c.ID" :value="c.ID">{{ c.NAME }}</option>
          </select>
          <input v-model="newExpense.description" placeholder="Description" aria-label="Description" />
          <input v-model.number="newExpense.amount" type="number" step="0.01" placeholder="Amount" aria-label="Amount" />
          <button type="submit">Add Expense</button>
        </form>
      </div>

      <div class="panel list-panel">
        <h2>Recent Expenses</h2>
        <p v-if="loading" class="muted">Loading...</p>
        <p v-else-if="error" class="muted">{{ error }}</p>
        <p v-else-if="!expenses.length" class="muted">No expenses yet.</p>
        <ul v-else>
          <li v-for="e in expenses" :key="e.ID">
            <span class="dot" :style="{ background: categoryColorMap[e.CATEGORY_NAME] }"></span>
            <div class="expense-info">
              <div class="expense-desc">{{ e.DESCRIPTION }}</div>
              <div class="expense-category">{{ e.CATEGORY_NAME }}</div>
            </div>
            <div class="expense-amount">${{ Number(e.AMOUNT).toFixed(2) }}</div>
            <button type="button" class="delete-btn" aria-label="Delete expense" @click="store.deleteExpense(e.ID)">
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M1 1L13 13M13 1L1 13" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>
            </button>
          </li>
        </ul>
      </div>

      <div class="panel breakdown-panel">
        <h2>By Category</h2>
        <p v-if="!categoryBreakdown.length" class="muted">No data yet.</p>
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

.accent {
  color: #34D399;
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
  color: #F87171;
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
