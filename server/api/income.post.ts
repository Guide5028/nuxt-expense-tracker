import { dbQuery } from "../utils/db"
import oracledb from 'oracledb'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  if (!body.description || !body.amount) {
    throw createError({ statusCode: 400, statusMessage: 'description and amount are required' })
  }

  const result = await dbQuery(
    `INSERT INTO income (description, amount)
     VALUES (:description, :amount)
     RETURNING id INTO :id`,
    {
      description: body.description,
      amount: body.amount,
      id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
    }
  )

  return { id: result.outBinds.id[0] }
})
