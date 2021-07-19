import express from 'express'
const router = express.Router()

import handler from '../../middleware/handler'

router.get(
	'/',
	handler(async (db) => await db.query('SELECT * FROM websites ORDER BY name'))
)

router.get(
	'/:id/star',
	handler(async (db, { id }) => {
		const result: any[] = await db.query(
			'SELECT stars.name FROM stars JOIN videostars ON stars.id = videostars.starID JOIN videowebsites ON videostars.videoID = videowebsites.videoID WHERE videowebsites.websiteID = :websiteID GROUP BY stars.id',
			{ websiteID: id }
		)

		return {
			path: `/website/${id}/star`,
			name: `get all stars from websiteID=${id}`,
			stars: result.map((star) => star.name).sort()
		}
	})
)

export default router
