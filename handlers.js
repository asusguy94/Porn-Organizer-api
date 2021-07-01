module.exports = {
	successHandler: (res, data) => {
		if (res) res.send(data)
	},
	errorHandler: (res, err, code = 404) => {
		if (err) {
			console.log(err.message)
			if (res) res.status(code).send(err.message)
		} else {
			if (res) res.status(code)
		}
	},
	closeHandler: (res, db = null) => {
		if (db !== null) db.end()
		if (res) res.end()
	}
}
