const express = require('express')
const router = express.Router()

const handler = require('../../middleware/handlers')

router.get(
	'/',
	handler(async db => await db.query('SELECT * FROM websites ORDER BY name'))
)

router.get(
	'/:id/star',
	handler(async (db, { id }) => {
		const result = await db.query(
			'SELECT stars.name FROM stars JOIN videostars ON stars.id = videostars.starID JOIN videowebsites ON videostars.videoID = videowebsites.videoID WHERE videowebsites.websiteID = :websiteID GROUP BY stars.id',
			{ websiteID: id }
		)
		const stars = result.map(star => star.name)

		return {
			path: `/website/${id}/star`,
			name: `get all stars from websiteID=${id}`,
			stars: stars.sort()
		}
	})
)

module.exports = router
