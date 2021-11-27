import Fastify from 'fastify'
const fastify = Fastify()

import { logger } from './middleware/logger'

fastify.register(require('./routes'))

fastify.listen(8080, '0.0.0.0', (_err, address) => {
	logger(`listening on ${address}`)
})
