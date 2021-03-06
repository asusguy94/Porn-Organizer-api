import { FastifyInstance } from 'fastify'
import Joi from 'joi'

import handler from '../../middleware/handler'
import schemaHandler from '../../middleware/schema'

export default async (fastify: FastifyInstance) => {
	fastify.get(
		'/',
		handler(async (db) => await db.query('SELECT * FROM attributes ORDER BY name'))
	)

	fastify.post(
		'/',
		handler(async (db, {}, body) => {
			const { name } = schemaHandler(
				Joi.object({
					name: Joi.string().min(3).required()
				}),
				body
			)

			await db.query('INSERT INTO attributes(name) VALUES(:attribute)', {
				attribute: name
			})
		})
	)

	fastify.put(
		'/:id',
		handler(async (db, { id }, body) => {
			const { value } = schemaHandler(
				Joi.object({
					value: Joi.string().min(3).required()
				}),
				body
			)

			await db.query('UPDATE attributes SET name = :value WHERE id = :attributeID', {
				attributeID: id,
				value
			})
		})
	)

	fastify.delete(
		'/:id',
		handler(async (db, { id }) => {
			await db.query('DELETE FROM videoattributes WHERE id = :attributeID', { attributeID: id })
		})
	)
}
