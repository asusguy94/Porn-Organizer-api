const express = require('express')
const router = express.Router()
const Joi = require('joi')

const handler = require('../../middleware/handlers')
const schemaHandler = require('../../middleware/schema')

router.get(
	'/',
	handler(async db => await db.query('SELECT * FROM locations ORDER BY name'))
)

router.post(
	'/',
	handler(async (db, params, body) => {
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

module.exports = router
