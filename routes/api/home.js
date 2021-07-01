const express = require('express')
const router = express.Router()

const { getResizedThumb } = require('../../helper')

const handler = require('../../middleware/handlers')

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

		const filteredResult = []
		for (let i = 0; i < result.length; i++) {
			const video = result[i]

			video.image = await getResizedThumb(video.id)

			filteredResult.push(video)
		}

		return filteredResult
	})
)
module.exports = router
