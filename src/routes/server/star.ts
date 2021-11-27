import { FastifyInstance } from 'fastify'
import Joi from 'joi'

import fs from 'fs'
import { downloader } from '../../helper'

import handler from '../../middleware/handler'
import schemaHandler from '../../middleware/schema'

export default async (fastify: FastifyInstance) => {
	fastify.post(
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

	fastify.delete(
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

	fastify.get(
		'/:id',
		handler(async (db, { id }) => {
			const { image } = (await db.query('SELECT image FROM stars WHERE id = :id', { id }))[0]

			return fs.createReadStream(`./public/images/stars/${image}`)
		})
	)
}
