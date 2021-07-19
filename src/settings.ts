import mariaDB from './db'
import { error as errorHandler, close as closeHandler } from './middleware/handler'

export const getSetting = async (label: string) => {
	try {
		var db = await mariaDB()

		const result = await db.query(`SELECT ${label} FROM settings LIMIT 1`)
		return result[0][label]
	} catch (err) {
		errorHandler(null, err)
	} finally {
		//@ts-ignore
		closeHandler(null, db)
	}
}
