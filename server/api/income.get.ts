import { dbQuery } from "../utils/db"

export default defineEventHandler(async () => {
  const result = await dbQuery(`
    SELECT id, description, amount, received_on
    FROM income
    ORDER BY received_on DESC, id DESC
  `)
  return result.rows
})
