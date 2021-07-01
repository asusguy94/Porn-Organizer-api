const express = require('express')
const app = express()

// Routes
require('./startup/routes')(app)

const port = process.env.PORT || 8090
app.listen(port, () => {
	console.log(`Listening to port ${port}`)
})
