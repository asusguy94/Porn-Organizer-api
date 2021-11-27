import { FastifyInstance } from 'fastify'

import handler from '../../middleware/handler'

export default async (fastify: FastifyInstance) => {
	fastify.get(
		'/',
		handler(() => 'Test Handler')
	)
}
