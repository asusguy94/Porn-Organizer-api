import express from 'express'
const app = express()

import routes from './routes'

const port = 8080
app.listen(port, () => {
	console.log(`Listening to port ${port}`)

	routes(app)
})
