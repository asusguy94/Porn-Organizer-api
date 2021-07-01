const express = require('express')
const router = express.Router()
const Joi = require('joi')

const handler = require('../../middleware/handlers')
const schemaHandler = require('../../middleware/schema')

router.get(
	'/',
	handler(async db => await db.query('SELECT * FROM country ORDER BY name'))
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

		const result = await db.query('SELECT COUNT(*) as total FROM country WHERE name = :country LIMIT 1', {
			country: name
		})

		if (!result[0].total) {
			await db.query('INSERT INTO country(name, code) VALUES(:country, 0)', {
				country: name
			})
		} else {
			throw new Error('Country already exists')
		}
	})
)

router.put(
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

		const result = await db.query('SELECT name, code FROM country WHERE id = :countryID LIMIT 1', { countryID: id })
		return result[0]
	})
)

module.exports = router
