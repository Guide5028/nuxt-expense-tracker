import { dbQuery } from "../utils/db"

export default defineEventHandler(async () => {
  const result = await dbQuery('SELECT id, name FROM categories ORDER BY name')
  return result.rows
})