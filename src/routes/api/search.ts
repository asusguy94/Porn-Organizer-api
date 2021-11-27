import { FastifyInstance } from 'fastify'

import { formatDate, getResizedThumb } from '../../helper'

import handler from '../../middleware/handler'

export default async (fastify: FastifyInstance) => {
	type IVideo = any
	type IStar = any

	const initArray = (arr: (IStar | IVideo)[], item: IStar | IVideo) => {
		if (item !== null) {
			if (!arr.includes(item)) arr.push(item)
		}

		return arr
	}

	fastify.get(
		'/video',
		handler(async (db) => {
			const result = await db.query(
				'SELECT videos.id AS videoID, videos.height, videos.starAge, videos.path AS videoPath, videos.name AS videoName, videos.date AS videoDate, videos.added AS videoAdded, stars.name AS star, datediff(videos.date, stars.birthdate) AS ageinvideo, websites.name AS websiteName, sites.name AS siteName, categories.name AS categoryName, attributes.name AS attributeName, locations.name AS locationName FROM videos LEFT OUTER JOIN videostars ON videos.id = videostars.videoID LEFT JOIN stars ON stars.id = videostars.starID LEFT JOIN videowebsites ON videos.id = videowebsites.videoID LEFT JOIN websites ON videowebsites.websiteID = websites.id LEFT OUTER JOIN videosites ON videosites.videoID = videos.id LEFT JOIN sites ON sites.id = videosites.siteID LEFT OUTER JOIN videoattributes ON videos.id = videoattributes.videoID LEFT JOIN attributes ON videoattributes.attributeID = attributes.id LEFT OUTER JOIN videolocations ON videos.id = videolocations.videoID LEFT JOIN locations ON videolocations.locationID = locations.id LEFT JOIN bookmarks ON videos.id = bookmarks.videoID LEFT JOIN categories ON bookmarks.categoryID = categories.id ORDER BY videoName, videoPath'
			)

			const videos = []
			for (
				let i = 0,
					len = result.length,
					categoryArr = [],
					attributeArr = [],
					locationArr = [],
					video: IVideo = {};
				i < len;
				i++
			) {
				const prev = result[i - 1]
				const current = result[i]
				const next = result[i + 1]

				const { videoID, videoName, videoPath, videoDate, star, ageinvideo, websiteName, siteName } = current

				// Array-Item
				const { categoryName, attributeName, locationName } = current

				// Duplicate-check functions
				const nextIsDuplicate = i < len - 1 && next.videoPath === videoPath
				const prevIsDuplicate = i > 0 && prev.videoPath === videoPath

				// INIT array
				categoryArr = initArray(categoryArr, categoryName)
				attributeArr = initArray(attributeArr, attributeName)
				locationArr = initArray(locationArr, locationName)

				if (!prevIsDuplicate) {
					// Video Details
					video.id = videoID
					video.quality = current.height
					video.date = formatDate(videoDate, true)
					video.name = videoName
					video.image = await getResizedThumb(videoID)
					video.star = star
					video.ageInVideo = ageinvideo
					video.website = websiteName
					video.site = siteName || ''

					const data = await db.query('SELECT COUNT(*) as total FROM plays WHERE videoID = :videoID', {
						videoID
					})
					video.plays = data[0].total

					video.pov = categoryArr.every((category) => category.endsWith(' (POV)'))
				}

				if (!nextIsDuplicate) {
					video.categories = categoryArr
					video.attributes = attributeArr
					video.locations = locationArr

					videos.push(video)

					// Reset Array
					categoryArr = []
					attributeArr = []
					locationArr = []

					// Reset CurrentObject
					video = {}
				}
			}

			return videos
		})
	)

	fastify.get(
		'/star',
		handler(async (db) => {
			const result = await db.query(
				'SELECT stars.id AS starID, stars.name AS starName, image, eyecolor, haircolor, breast, videostars.videoID, ethnicity, stars.country, DATEDIFF(NOW(), birthdate) AS age, websites.name AS websiteName, sites.name AS siteName, (SELECT COUNT(videostars.id) FROM videostars WHERE videostars.starID = stars.id) AS videoCount FROM stars LEFT JOIN videostars ON videostars.starID = stars.id LEFT JOIN videowebsites ON videowebsites.videoID = videostars.videoID LEFT JOIN websites ON websites.id = videowebsites.websiteID LEFT JOIN videosites ON videowebsites.videoID = videosites.videoID LEFT JOIN sites ON videosites.siteID = sites.id ORDER BY stars.name, videoID'
			)

			const stars = []
			for (let i = 0, len = result.length, websiteArr = [], siteArr = [], star: IStar = {}; i < len; i++) {
				const prev = result[i - 1]
				const current = result[i]
				const next = result[i + 1]

				const { starID, starName, image, breast, eyecolor, haircolor, ethnicity, age, country, videoCount } =
					current

				// Array-Item
				const { websiteName, siteName } = current

				// Duplicate-check functions
				const nextIsDuplicate = i < len - 1 && next.starID === starID
				const prevIsDuplicate = i > 0 && prev.starID === starID

				// INIT array
				websiteArr = initArray(websiteArr, websiteName)
				siteArr = initArray(siteArr, siteName)

				if (!prevIsDuplicate) {
					// Video Details
					star.id = starID
					star.name = starName
					star.image = image || ''
					star.breast = breast || ''
					star.eyecolor = eyecolor || ''
					star.haircolor = haircolor || ''
					star.ethnicity = ethnicity || ''
					star.age = age || ''
					star.country = country || ''
					star.videoCount = videoCount
				}

				if (!nextIsDuplicate) {
					star.websites = websiteArr
					star.sites = siteArr

					stars.push(star)

					// Reset Array
					websiteArr = []
					siteArr = []

					// Reset CurrentObject
					star = {}
				}
			}

			return stars
		})
	)
}
