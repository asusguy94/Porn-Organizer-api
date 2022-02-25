import { FastifyInstance } from 'fastify'
import Joi from 'joi'

import handler from '../../middleware/handler'
import schemaHandler from '../..//middleware/schema'

export default async (fastify: FastifyInstance) => {
	fastify.put(
		'/:id',
		handler(async (db, { id }, body) => {
			const { time, categoryID } = schemaHandler(
				Joi.object({
					time: Joi.number().integer().min(1),
					categoryID: Joi.number().integer().min(1)
				}).xor('time', 'categoryID'),
				body
			)

			if (time !== undefined) {
				// Change BookmarkTime
					await db.query('UPDATE bookmarks SET start = :time WHERE id = :bookmarkID', {
					time,
						bookmarkID: id
					})

					// Return NEW bookmark
				const bookmark = (
					await db.query('SELECT * FROM bookmarks WHERE id = :bookmarkID LIMIT 1', {
						bookmarkID: id
					})
				)[0]

				return bookmark
			} else if (categoryID != undefined) {
				// Change CategoryID
				await db.query('UPDATE bookmarks SET categoryID = :categoryID WHERE id = :bookmarkID', {
					categoryID,
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
