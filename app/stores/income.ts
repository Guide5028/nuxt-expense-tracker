interface IncomeEntry {
  ID: number;
  DESCRIPTION: string;
  AMOUNT: number;
  RECEIVED_ON: string;
}

export const useIncomeStore = defineStore("income", () => {
  const income = ref<IncomeEntry[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const totalIncome = computed(() =>
    income.value.reduce((sum, i) => sum + Number(i.AMOUNT), 0),
  );

  async function fetchIncome() {
    loading.value = true;
    error.value = null;
    try {
      income.value = await $fetch("/api/income");
    } catch (e) {
      error.value = "Failed to load income";
    } finally {
      loading.value = false;
    }
  }

  async function addIncome(payload: { description: string; amount: number | null }) {
    await $fetch("/api/income", { method: "POST", body: payload });
    await fetchIncome();
  }

  async function deleteIncome(id: number) {
    await $fetch(`/api/income/${id}`, { method: "DELETE" });
    await fetchIncome();
  }

  return {
    income,
    loading,
    error,
    totalIncome,
    fetchIncome,
    addIncome,
    deleteIncome,
  };
});
