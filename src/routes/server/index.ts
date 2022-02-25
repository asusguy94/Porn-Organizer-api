import { FastifyInstance } from 'fastify'

import starRoute from './star'
import videoRoute from './video'
import generateRoute from './generate'

import testRoute from './testRoute'

export default async (fastify: FastifyInstance) => {
	fastify.register(starRoute, { prefix: 'star' })
	fastify.register(videoRoute, { prefix: 'video' })
	fastify.register(generateRoute, { prefix: 'generate' })

	fastify.register(testRoute, { prefix: 'test' })
}
