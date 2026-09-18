<script setup>
const store = useExpensesStore()
const { categories, expenses, loading, error, totalAmount } = storeToRefs(store)

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
    <h1>Expense Tracker</h1>

    <p class="total">Total: ${{ totalAmount.toFixed(2) }}</p>

    <form @submit.prevent="submitExpense">
      <select v-model="newExpense.categoryId">
        <option :value="null" disabled>Select category</option>
        <option v-for="c in categories" :key="c.ID" :value="c.ID">{{ c.NAME }}</option>
      </select>
      <input v-model="newExpense.description" placeholder="Description" />
      <input v-model.number="newExpense.amount" type="number" step="0.01" placeholder="Amount" />
      <button type="submit">Add</button>
    </form>

    <p v-if="loading">Loading...</p>
    <p v-else-if="error">{{ error }}</p>
    <ul v-else>
      <li v-for="e in expenses" :key="e.ID">
        <span>{{ e.DESCRIPTION }} — ${{ Number(e.AMOUNT).toFixed(2) }} ({{ e.CATEGORY_NAME }})</span>
        <button @click="store.deleteExpense(e.ID)">✕</button>
      </li>
    </ul>
  </div>
</template>

<style>
.page { max-width: 480px; margin: 40px auto; font-family: sans-serif; }
.total { font-size: 1.2em; font-weight: bold; }
form { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
ul { list-style: none; padding: 0; }
li { display: flex; align-items: center; justify-content: space-between; padding: 4px 0; }
</style>