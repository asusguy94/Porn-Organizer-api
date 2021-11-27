import { FastifyInstance } from 'fastify'
import Joi from 'joi'

import handler from '../../middleware/handler'
import schemaHandler from '../..//middleware/schema'

export default async (fastify: FastifyInstance) => {
	fastify.put(
		'/:id',
		handler(async (db, { id }, body) => {
			const value = schemaHandler(
				Joi.object({
					time: Joi.number().integer().min(1),
					categoryID: Joi.number().integer().min(1)
				}).xor('time', 'categoryID'),
				body
			)

			if ('time' in value) {
				// Change BookmarkTime
				const video = await db.query('SELECT videoID FROM bookmarks WHERE id = :id LIMIT 1', { id })
				const videoID = video[0].videoID

				const result = await db.query(
					'SELECT COUNT(*) as total FROM bookmarks WHERE start = :time AND videoID = :videoID LIMIT 1',
					{
						time: value.time,
						videoID
					}
				)
				if (!result[0].total) {
					await db.query('UPDATE bookmarks SET start = :time WHERE id = :bookmarkID', {
						time: value.time,
						bookmarkID: id
					})

					// Return NEW bookmark
					const bookmark = await db.query('SELECT * FROM bookmarks WHERE id = :bookmarkID LIMIT 1', {
						bookmarkID: id
					})

					return bookmark[0]
				}
			} else if ('categoryID' in value) {
				// Change CategoryID
				await db.query('UPDATE bookmarks SET categoryID = :categoryID WHERE id = :bookmarkID', {
					categoryID: value.categoryID,
					bookmarkID: id
				})
			}
		})
	)

	fastify.delete(
		'/:id',
		handler(async (db, { id }) => {
			await db.query('DELETE FROM bookmarks WHERE id = :id', { id })
		})
	)
}
