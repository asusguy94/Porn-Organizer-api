const express = require('express')
const router = express.Router()
const Joi = require('joi')

const { formatBreastSize, formatDate, getCountryCode, getSimilarStars, getResizedThumb } = require('../../helper')
const { getProfileLink, getProfileData, setProfileData } = require('../../freeones')
const { generateStarName } = require('../../generate')

const handler = require('../../middleware/handlers')
const schemaHandler = require('../../middleware/schema')

router.get(
	'/',
	handler(async db => {
		// Define Structure
		const data = {
			breast: [],
			eyecolor: [],
			haircolor: [],
			ethnicity: [],
			country: []
		}

		// Queries
		const breast = await db.query('SELECT breast FROM stars WHERE breast IS NOT NULL GROUP BY breast')
		const eyecolor = await db.query('SELECT eyecolor FROM stars WHERE eyecolor IS NOT NULL GROUP BY eyecolor')
		const haircolor = await db.query('SELECT haircolor FROM stars WHERE haircolor IS NOT NULL GROUP BY haircolor')
		const ethnicity = await db.query('SELECT ethnicity FROM stars WHERE ethnicity IS NOT NULL GROUP BY ethnicity')
		const country = await db.query(
			'SELECT country.name, code FROM stars JOIN country ON stars.country = country.name GROUP BY country.name'
		)
		// TODO skips over any country-value with NULL
		// Either if the country-code relation does not exist (THIS SHOULD NOT BE SKIPPED)
		// Or if the country-field is empty (THIS SHOULD BE SKIPPED)

		// Map Data
		data.breast = breast.map(({ breast }) => breast)
		data.eyecolor = eyecolor.map(({ eyecolor }) => eyecolor)
		data.haircolor = haircolor.map(({ haircolor }) => haircolor)
		data.ethnicity = ethnicity.map(({ ethnicity }) => ethnicity)
		data.country = country.map(({ code, name }) => ({ code, name }))

		return data
	})
)

// Add New Star
router.post(
	'/',
	handler(async (db, params, body) => {
		const { name } = schemaHandler(
			Joi.object({
				name: Joi.string().required()
			}),
			body
		)

		await db.query('INSERT INTO stars(name) VALUES(:star)', { star: name })
	})
)

// Get Missing Stars
router.get(
	'/missing',
	handler(async db => {
		// STARS
		const missingImages = await db.query(
			'SELECT id, name, image FROM stars WHERE image IS NULL OR (breast IS NULL AND eyecolor IS NULL AND haircolor IS NULL AND ethnicity IS NULL AND country IS NULL AND birthdate IS NULL AND height IS NULL AND weight IS NULL AND start IS NULL and end IS NULL) OR autoTaggerIgnore = TRUE'
		)

		const stars = missingImages.map(star => ({ id: star.id, name: star.name, image: star.image }))

		// VideoStars Without STAR
		const missingStars = await db.query(
			'SELECT videos.id, videos.path FROM videos LEFT JOIN videostars ON videostars.videoID = videos.id LEFT JOIN stars ON videostars.id = stars.id GROUP BY videos.id HAVING COUNT(videostars.id) < 1'
		)

		let missing = []
		for (let i = 0; i < missingStars.length; i++) {
			const video = missingStars[i]

			const star = generateStarName(video.path)

			// Check if star is already defined
			// USE /generate/thumb instead
			const result = await db.query('SELECT COUNT(*) as total FROM stars WHERE name = :star', { star })
			if (!result[0].total) {
				missing.push({ videoID: video.id, name: star })
			}
		}

		return { stars, missing }
	})
)

router.get(
	'/all',
	handler(async db => await db.query('SELECT name FROM stars'))
)

router.get(
	'/:id',
	handler(async (db, { id }) => {
		const stars = await db.query('SELECT * FROM stars WHERE id = :starID LIMIT 1', { starID: id })
		if (stars[0]) {
			const star = stars[0]

			star.ignored = star.autoTaggerIgnore
			delete star.autoTaggerIgnore

			star.info = {
				breast: star.breast,
				eyecolor: star.eyecolor,
				haircolor: star.haircolor,
				ethnicity: star.ethnicity,

				country: {
					name: star.country,
					code: await getCountryCode(db, star.country)
				},

				// Items without autocomplete
				birthdate: star.birthdate ? formatDate(star.birthdate, true) : '',
				height: String(star.height || ''),
				weight: String(star.weight || ''),
				start: String(star.start || ''),
				end: String(star.end || '')
			}
			delete star.haircolor
			delete star.eyecolor
			delete star.breast
			delete star.ethnicity
			delete star.country
			delete star.birthdate
			delete star.height
			delete star.weight
			delete star.start
			delete star.end

			star.similar = await getSimilarStars(db, id)

			return star
		} else {
			throw new Error('Star does not exist')
		}
	})
)

router.put(
	'/:id',
	handler(async (db, { id }, body) => {
		const value = schemaHandler(
			Joi.object({
				name: Joi.string(),
				label: Joi.string(),
				value: Joi.string().allow(''),
				ignore: Joi.number().integer().min(0).max(1)
			})
				.with('label', 'value')
				.xor('name', 'label', 'ignore'),
			body
		)

		if ('name' in value) {
			const { name } = value

			const result = await db.query('SELECT COUNT(*) as total FROM stars WHERE name = :name', { name })
			if (!result[0].total) {
				await db.query('UPDATE stars SET name = :name WHERE id = :starID', { name, starID: id })
			}
		} else if ('label' in value) {
			// TODO make code more readable
			// reusing multiple variables
			// some are not necessary
			// some are being checked in reactJS

			const { label } = value
			let data = value.value
			let content = null

			// ALWAYS refresh page when changing AGE!
			let reload = label === 'birthdate'

			if (!data.length) {
				data = null

				await db.query(`UPDATE stars SET ${label} = NULL WHERE id = :starID`, { starID: id })
			} else {
				let valueRef = data

				if (label === 'breast') {
					data = formatBreastSize(data)
					reload = valueRef !== data
				} else if (label === 'birthdate') {
					data = formatDate(data, true)
				} else if (label === 'country') {
					data = valueRef

					content = {
						name: valueRef,
						code: await getCountryCode(db, valueRef)
					}
				} else {
					data = valueRef
				}

				await db.query(`UPDATE stars SET ${label} = :value WHERE id = :starID`, { value: data, starID: id })
			}

			return {
				reload,
				content: content ? content : data,
				similar: await getSimilarStars(db, id)
			}
		} else if ('ignore' in value) {
			await db.query('UPDATE stars SET autoTaggerIgnore = :ignore WHERE id = :starID', {
				ignore: value.ignore,
				starID: id
			})

			const star = await db.query('SELECT * FROM stars WHERE id = :starID LIMIT 1', { starID: id })
			return star[0]
		}
	})
)

router.delete(
	'/:id',
	handler(async (db, { id }) => {
		const result = await db.query('SELECT COUNT(*) as total FROM videostars WHERE starID = :starID', { starID: id })
		if (!result[0].total) {
			await db.query('DELETE FROM stars WHERE id = :starID', { starID: id })
			await db.query('DELETE FROM staralias WHERE starID = :starID', { starID: id })
		}
	})
)

router.get(
	'/:id/video',
	handler(async (db, { id }) => {
		const result = await db.query(
			'SELECT videos.id, videos.name, videos.date, videos.path as fname, websites.name AS website, sites.name AS site, COALESCE(starAge * 365, DATEDIFF(videos.date, stars.birthdate)) AS age FROM videos LEFT JOIN videosites ON videos.id = videosites.videoID LEFT JOIN sites ON videosites.siteID = sites.id JOIN videostars ON videos.id = videostars.videoID JOIN stars ON videostars.starID = stars.id JOIN videowebsites ON videos.id = videowebsites.videoID JOIN websites ON videowebsites.websiteID = websites.id WHERE videostars.starID = :starID ORDER BY age',
			{ starID: id }
		)

		const videos = []
		for (let i = 0; i < result.length; i++) {
			const video = result[i]

			video.image = await getResizedThumb(video.id)

			videos.push(video)
		}

		return videos
	})
)

router.post(
	'/:id/freeones',
	handler(async (db, { id }) => {
		const profileLink = await getProfileLink(db, id)
		if (profileLink) {
			const info = await getProfileData(profileLink)

			if (info) {
				const star = await db.query('SELECT * FROM stars WHERE id = :starID', { starID: id })
				const starDetails = star[0]

				if (!starDetails.birthdate && info.birthdate) {
					await setProfileData(db, id, 'birthdate', info.birthdate)
				}

				if (!starDetails.country && info.country) {
					await setProfileData(db, id, 'country', info.country)
				}

				if (!starDetails.ethnicity && info.ethnicity) {
					await setProfileData(db, id, 'ethnicity', info.ethnicity)
				}

				if (!starDetails.start && info.start) {
					await setProfileData(db, id, 'start', info.start)
				}

				if (!starDetails.end && info.end) {
					await setProfileData(db, id, 'end', info.end)
				}

				if (Object.keys(info.appearance).length) {
					const appearance = info.appearance

					if (!starDetails.breast && appearance.boobs) {
						await setProfileData(db, id, 'breast', formatBreastSize(appearance.boobs))
					}

					if (!starDetails.eyecolor && appearance.eyecolor) {
						await setProfileData(db, id, 'eyecolor', appearance.eyecolor)
					}

					if (!starDetails.haircolor && appearance.haircolor) {
						await setProfileData(db, id, 'haircolor', appearance.haircolor)
					}

					if (!starDetails.height && appearance.height) {
						await setProfileData(db, id, 'height', appearance.height)
					}

					if (!starDetails.weight && appearance.weight) {
						await setProfileData(db, id, 'weight', appearance.weight)
					}
				}
			}
		}
	})
)

router.delete(
	'/:id/freeones',
	handler(async (db, { id }) => {
		await db.query(
			'UPDATE stars SET haircolor = NULL, eyecolor = NULL, breast = NULL, ethnicity = NULL, country = NULL, birthdate = NULL, height = NULL, height = NULL, weight = NULL, start = NULL, end = NULL WHERE id = :starID',
			{ starID: id }
		)
	})
)

module.exports = router
