import { FastifyInstance } from 'fastify'

import path from 'path'

import apiRoute from './routes/api'
import serverRoute from './routes/server'

export default async (fastify: FastifyInstance) => {
	//cors
	fastify.register(require('fastify-cors'))

	//static
	fastify.register(require('fastify-static'), {
		// this path is required for dash/hls to work
		/// since they use a path specified in the manifest
		root: path.join(__dirname, '../public/videos'),
		prefix: '/videos/'
	})

	fastify.register(apiRoute, { prefix: 'api' })
	fastify.register(serverRoute)
}
