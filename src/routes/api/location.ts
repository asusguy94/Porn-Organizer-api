import express from 'express'
const router = express.Router()
import Joi from 'joi'

import handler from '../../middleware/handler'
import schemaHandler from '../../middleware/schema'

router.get(
	'/',
	handler(async (db) => await db.query('SELECT * FROM locations ORDER BY name'))
)

router.post(
	'/',
	handler(async (db, {}, body) => {
		const { name } = schemaHandler(
			Joi.object({
				name: Joi.string().min(3).required()
			}),
			body
		)

		const result = await db.query('SELECT COUNT(*) as total FROM locations WHERE name = :location LIMIT 1', {
			location: name
		})
		if (!result[0].total) {
			await db.query('INSERT INTO locations(name) VALUES(:location)', {
				location: name
			})
		} else {
			throw new Error('Location already exists')
		}
	})
)

router.put(
	'/:id',
	handler(async (db, { id }, body) => {
		const { value } = schemaHandler(
			Joi.object({
				value: Joi.string().min(3).required()
			}),
			body
		)

		await db.query('UPDATE locations SET name = :value WHERE id = :locationID', {
			locationID: id,
			value
		})
	})
)

router.delete(
	'/:id',
	handler(async (db, { id }) => {
		await db.query('DELETE FROM videolocations WHERE id = :locationID', { locationID: id })
	})
)

export default router
