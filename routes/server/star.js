const express = require('express')
const router = express.Router()
const Joi = require('joi')

const fs = require('fs')

const { downloader } = require('../../helper')

const handler = require('../../middleware/handlers')
const schemaHandler = require('../../middleware/schema')

router.post(
	'/:id/image',
	handler(async (db, { id }, body) => {
		const { url } = schemaHandler(
			Joi.object({
				url: Joi.string().required()
			}),
			body
		)

		// Update Database
		await db.query('UPDATE stars SET image = :image WHERE id = :starID', { image: `${id}.jpg`, starID: id })

		// Download Image
		await downloader(url, `public/images/stars/${id}.jpg`)

		return { image: `${id}.jpg` }
	})
)

router.delete(
	'/:id/image',
	handler(async (db, { id }) => {
		const result = await db.query('SELECT image FROM stars WHERE id = :starID LIMIT 1', { starID: id })
		if (result[0].image) {
			const path = `images/stars/${result[0].image}`

			await db.query('UPDATE stars SET image = NULL WHERE id = :starID', { starID: id })

			fs.unlinkSync(`./public/${path}`)
		} else {
			throw new Error('Incorrect ID')
		}
	})
)

module.exports = router
