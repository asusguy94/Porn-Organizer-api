import express from 'express'
const router = express.Router()

import { getResizedThumb } from '../../helper'

import handler from '../../middleware/handler'

router.get(
	'/:type/:limit',
	handler(async (db, { type, limit }) => {
		let result = null
		switch (type) {
			case 'recent':
				result = await db.query(
					`SELECT videos.id, videos.name, 0 AS total FROM videos ORDER BY id DESC LIMIT ${limit}`
				)
				break

			case 'newest':
				result = await db.query(
					`SELECT videos.id, videos.name, 0 AS total FROM videos ORDER BY date DESC LIMIT ${limit}`
				)
				break

			case 'popular':
				result = await db.query(
					`SELECT videos.id, videos.name, COUNT(*) AS total FROM plays JOIN videos ON plays.videoID = videos.id GROUP BY videoID ORDER BY total DESC, date DESC LIMIT ${limit}`
				)
				break

			case 'random':
				result = await db.query(
					`SELECT videos.id, videos.name, 0 AS total FROM videos ORDER BY RAND() LIMIT ${limit}`
				)
				break

			default:
				throw new Error(`/${type} is undefined`)
		}

		return await Promise.all(
			result.map(async (video: any) => {
				video.image = await getResizedThumb(video.id)

				return video
			})
		)
	})
)

export default router
