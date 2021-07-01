const express = require('express')
const router = express.Router()
const Joi = require('joi')

const handler = require('../../middleware/handlers')
const schemaHandler = require('../../middleware/schema')

router.get(
	'/',
	handler(async db => await db.query('SELECT * FROM categories ORDER BY name'))
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

		const result = await db.query('SELECT COUNT(*) as total FROM categories WHERE name = :category LIMIT 1', {
			category: name
		})

		if (!result[0].total) {
			await db.query('INSERT INTO categories(name) VALUES(:category)', {
				category: name
			})
		} else {
			throw new Error('Category already exists')
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

		await db.query('UPDATE categories SET name = :value WHERE id = :categoryID', {
			categoryID: id,
			value
		})
	})
)

module.exports = router
