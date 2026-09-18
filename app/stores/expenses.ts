export const useExpensesStore = defineStore('expenses', () => {
  const categories = ref([])
  const expenses = ref([])
  const loading = ref(false)
  const error = ref(null)

  const totalAmount = computed(() =>
    expenses.value.reduce((sum, e) => sum + Number(e.AMOUNT), 0)
  )

  async function fetchCategories() {
    categories.value = await $fetch('/api/categories')
  }

  async function fetchExpenses() {
    loading.value = true
    error.value = null
    try {
      expenses.value = await $fetch('/api/expenses')
    } catch (e) {
      error.value = 'Failed to load expenses'
    } finally {
      loading.value = false
    }
  }

  async function addExpense(payload) {
    await $fetch('/api/expenses', { method: 'POST', body: payload })
    await fetchExpenses()
  }

  async function deleteExpense(id) {
    await $fetch(`/api/expenses/${id}`, { method: 'DELETE' })
    await fetchExpenses()
  }

  return {
    categories, expenses, loading, error, totalAmount,
    fetchCategories, fetchExpenses, addExpense, deleteExpense
  }
})