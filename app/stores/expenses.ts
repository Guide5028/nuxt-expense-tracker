interface Category {
  ID: number;
  NAME: string;
}

interface Expense {
  ID: number;
  DESCRIPTION: string;
  AMOUNT: number;
  CATEGORY_NAME: string;
  SPENT_ON: string;
}

export const useExpensesStore = defineStore("expenses", () => {
  const categories = ref<Category[]>([]);
  const expenses = ref<Expense[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const totalAmount = computed(() =>
    expenses.value.reduce((sum, e) => sum + Number(e.AMOUNT), 0),
  );

  async function fetchCategories() {
    categories.value = await $fetch("/api/categories");
  }

  async function fetchExpenses() {
    loading.value = true;
    error.value = null;
    try {
      expenses.value = await $fetch("/api/expenses");
    } catch (e) {
      error.value = "Failed to load expenses";
    } finally {
      loading.value = false;
    }
  }

  async function addExpense(payload: { categoryId: number | null; description: string; amount: number | null }) {
    await $fetch("/api/expenses", { method: "POST", body: payload });
    await fetchExpenses();
  }

  async function deleteExpense(id: number) {
    await $fetch(`/api/expenses/${id}`, { method: "DELETE" });
    await fetchExpenses();
  }

  return {
    categories,
    expenses,
    loading,
    error,
    totalAmount,
    fetchCategories,
    fetchExpenses,
    addExpense,
    deleteExpense,
  };
});
