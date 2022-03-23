import { FastifyInstance } from 'fastify'

import handler from '../../middleware/handler'

export default async (fastify: FastifyInstance) => {
	fastify.get(
		'/',
		handler(async (db) => await db.query('SELECT * FROM sites ORDER BY name'))
	)
}
