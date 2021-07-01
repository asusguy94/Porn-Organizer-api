const { db: mariaDB } = require('../db')

const successHandler = (res, data) => {
	if (data) res.send(data)
}
const errorHandler = (res, err) => {
	res.status(404).send(err.message)
}
const closeHandler = (res, db) => {
	db.end()
	res.end()
}

module.exports = function handler(callback) {
	return async (req, res) => {
		try {
			var db = await mariaDB()

			successHandler(res, await callback(db, req.params, req.body))
		} catch (err) {
			errorHandler(res, err)
		} finally {
			closeHandler(res, db)
		}
	}
}
