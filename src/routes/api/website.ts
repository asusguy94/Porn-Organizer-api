import { FastifyInstance } from 'fastify'

import handler from '../../middleware/handler'

export default async (fastify: FastifyInstance) => {
	fastify.get(
		'/',
		handler(async (db) => await db.query('SELECT * FROM websites ORDER BY name'))
	)

	fastify.get(
		'/:id/star',
		handler(async (db, { id }) => {
			const result: any[] = await db.query(
				'SELECT stars.name FROM stars JOIN videostars ON stars.id = videostars.starID JOIN videowebsites ON videostars.videoID = videowebsites.videoID WHERE videowebsites.websiteID = :websiteID GROUP BY stars.id',
				{ websiteID: id }
			)

			return {
				path: `/website/${id}/star`,
				name: `get all stars from websiteID=${id}`,
				stars: result.map((star) => star.name).sort()
			}
		})
	)
}
