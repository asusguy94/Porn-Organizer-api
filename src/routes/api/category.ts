import { FastifyInstance } from 'fastify'
import Joi from 'joi'

import handler from '../../middleware/handler'
import schemaHandler from '../../middleware/schema'

export default async (fastify: FastifyInstance) => {
	fastify.get(
		'/',
		handler(async (db) => await db.query('SELECT * FROM categories ORDER BY name'))
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

				await db.query('INSERT INTO categories(name) VALUES(:category)', {
					category: name
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

			await db.query('UPDATE categories SET name = :value WHERE id = :categoryID', {
				categoryID: id,
				value
			})
		})
	)
}
