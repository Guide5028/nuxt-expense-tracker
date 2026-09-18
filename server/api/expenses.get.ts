import { dbQuery } from "../utils/db"

export default defineEventHandler(async () => {
  const result = await dbQuery(`
    SELECT e.id, e.description, e.amount, e.spent_on,
           c.id AS category_id, c.name AS category_name
    FROM expenses e
    JOIN categories c ON c.id = e.category_id
    ORDER BY e.spent_on DESC, e.id DESC
  `)
  return result.rows
})