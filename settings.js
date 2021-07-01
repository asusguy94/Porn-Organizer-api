const { db: mariaDB } = require('./db')
const { errorHandler, closeHandler } = require('./handlers')

module.exports = {
	getSetting: async label => {
		try {
			var db = await mariaDB()

			const result = await db.query(`SELECT ${label} FROM settings LIMIT 1`)
			return result[0][label]
		} catch (err) {
			errorHandler(null, err)
		} finally {
			closeHandler(null, db)
		}
	}
}
