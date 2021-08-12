import express from 'express'
const app = express()

import { logger } from './middleware/logger'

import routes from './routes'

const port = 8080
app.listen(port, () => {
	logger(`Listening to port ${port}`)

	routes(app)
})
