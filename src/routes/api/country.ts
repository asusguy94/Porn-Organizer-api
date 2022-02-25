import { FastifyInstance } from 'fastify'
import Joi from 'joi'

import handler from '../../middleware/handler'
import schemaHandler from '../../middleware/schema'

export default async (fastify: FastifyInstance) => {
	fastify.get(
		'/',
		handler(async (db) => await db.query('SELECT * FROM country ORDER BY name'))
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

				await db.query('INSERT INTO country(name, code) VALUES(:country, 0)', {
					country: name
				})
		})
	)

	fastify.put(
		'/:id',
		handler(async (db, { id }, body) => {
			const { value, label } = schemaHandler(
				Joi.object({
					label: Joi.string().min(3).required(),
					value: Joi.string().min(2).required()
				}),
				body
			)

			if (label === 'country') {
				await db.query('UPDATE country SET name = :value WHERE id = :countryID', {
					value: value,
					countryID: id
				})
			} else if (label === 'code' && value.length === 2) {
				await db.query('UPDATE country SET code = :value WHERE id = :countryID', {
					value: value,
					countryID: id
				})
			} else {
				throw new Error(`label=${label},value=${value} is not allowed with length=${value.length}`)
			}

			return (
				await db.query('SELECT name, code FROM country WHERE id = :countryID LIMIT 1', {
				countryID: id
			})
			)[0]
		})
	)
}
