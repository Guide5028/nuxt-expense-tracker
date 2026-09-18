import { dbQuery } from "../utils/db"
import oracledb from 'oracledb'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body.categoryId || !body.description || !body.amount) {
    throw createError({ statusCode: 400, statusMessage: 'categoryId, description, and amount are required' })
  }

  const result = await dbQuery(
    `INSERT INTO expenses (category_id, description, amount)
     VALUES (:categoryId, :description, :amount)
     RETURNING id INTO :id`,
    {
      categoryId: body.categoryId,
      description: body.description,
      amount: body.amount,
      id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
    }
  )

  return { id: result.outBinds.id[0] }
})