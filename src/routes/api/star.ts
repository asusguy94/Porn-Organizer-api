import { FastifyInstance } from 'fastify'
import Joi from 'joi'

import { formatBreastSize, formatDate, getCountryCode, getSimilarStars } from '../../helper'
import { getProfileLink, getProfileData, setProfileData } from '../../freeones'
import { generateStarName } from '../../generate'

import handler from '../../middleware/handler'
import schemaHandler from '../../middleware/schema'
import { starExists } from '../../helper.db'

export default async (fastify: FastifyInstance) => {
	fastify.get(
		'/',
		handler(async (db) => {
			interface IData {
				breast: string[]
				eyecolor: string[]
				haircolor: string[]
				ethnicity: string[]
				country: {
					code: string
					name: string
				}[]
				websites: string[]
			}

			// Define Structure
			const data: IData = {
				breast: [],
				eyecolor: [],
				haircolor: [],
				ethnicity: [],
				country: [],
				websites: []
			}

			// Queries
			const breast = await db.query('SELECT breast FROM stars WHERE breast IS NOT NULL GROUP BY breast')
			const eyecolor = await db.query('SELECT eyecolor FROM stars WHERE eyecolor IS NOT NULL GROUP BY eyecolor')
			const haircolor = await db.query(
				'SELECT haircolor FROM stars WHERE haircolor IS NOT NULL GROUP BY haircolor'
			)
			const ethnicity = await db.query(
				'SELECT ethnicity FROM stars WHERE ethnicity IS NOT NULL GROUP BY ethnicity'
			)
			const country = await db.query(
				'SELECT country.name, code FROM stars JOIN country ON stars.country = country.name GROUP BY country.name'
			)
			// TODO skips over any country-value with NULL
			// Either if the country-code relation does not exist (THIS SHOULD NOT BE SKIPPED)
			// Or if the country-field is empty (THIS SHOULD BE SKIPPED)
			const websites = await db.query('SELECT name as website FROM websites')

			// Map Data
			data.breast = breast.map(({ breast }: { breast: string }) => breast)
			data.eyecolor = eyecolor.map(({ eyecolor }: { eyecolor: string }) => eyecolor)
			data.haircolor = haircolor.map(({ haircolor }: { haircolor: string }) => haircolor)
			data.ethnicity = ethnicity.map(({ ethnicity }: { ethnicity: string }) => ethnicity)
			data.country = country.map(({ code, name }: { code: string; name: string }) => ({ code, name }))
			data.websites = websites.map(({ website }: { website: string }) => website)

			return data
		})
	)

	// Add New Star
	fastify.post(
		'/',
		handler(async (db, {}, body) => {
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
	fastify.get(
		'/missing',
		handler(async (db) => {
			// STARS
			const missingImages: any[] = await db.query(
				'SELECT id, name, image FROM stars WHERE image IS NULL OR (breast IS NULL AND eyecolor IS NULL AND haircolor IS NULL AND ethnicity IS NULL AND country IS NULL AND birthdate IS NULL AND height IS NULL AND weight IS NULL) OR autoTaggerIgnore = TRUE'
			)

			const stars = missingImages.map((star) => ({ id: star.id, name: star.name, image: star.image }))

			// VideoStars Without STAR
			const missingStars = await db.query(
				'SELECT videos.id, videos.path FROM videos LEFT JOIN videostars ON videostars.videoID = videos.id LEFT JOIN stars ON videostars.id = stars.id GROUP BY videos.id HAVING COUNT(videostars.id) < 1'
			)

			const missing = []
			for (let i = 0; i < missingStars.length; i++) {
				const video = missingStars[i]

				const star = generateStarName(video.path)

				// Check if star is already defined
				// USE /generate/thumb instead
				const result = (await db.query('SELECT COUNT(*) as total FROM stars WHERE name = :star', { star }))[0]
				if (!result.total) {
					missing.push({ videoID: video.id, name: star })
				}
			}

			return { stars, missing }
		})
	)

	fastify.get(
		'/all',
		handler(async (db) => await db.query('SELECT name FROM stars'))
	)

	fastify.get(
		'/:id',
		handler(async (db, { id }) => {
			const star = (await db.query('SELECT * FROM stars WHERE id = :starID LIMIT 1', { starID: id }))[0]
			if (star) {
				return {
					ignored: star.autoTaggerIgnore,
					info: {
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
						weight: String(star.weight || '')
					},
					similar: await getSimilarStars(db, id)
				}
			} else {
				throw new Error('Star does not exist')
			}
		})
	)

	fastify.put(
		'/:id',
		handler(async (db, { id }, body) => {
			const { name, label, value, ignore } = schemaHandler(
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

			if (name !== undefined) {
				await db.query('UPDATE stars SET name = :name WHERE id = :starID', { name, starID: id })
			} else if (label !== undefined) {
				// TODO make code more readable
				// reusing multiple variables
				// some are not necessary
				// some are being checked in reactJS

				let data = value
				let content = null

				// ALWAYS refresh page when changing AGE!
				let reload = label === 'birthdate'

				if (!data.length) {
					data = null

					await db.query(`UPDATE stars SET ${label} = NULL WHERE id = :starID`, { starID: id })
				} else {
					const valueRef = data

					switch (label) {
						case 'breast':
							data = formatBreastSize(data)
							reload = valueRef !== data
							break
						case 'birthdate':
							data = formatDate(data, true)
							break
						case 'country':
							data = valueRef
							content = {
								name: valueRef,
								code: await getCountryCode(db, valueRef)
							}
							break
						default:
							data = valueRef
					}

					await db.query(`UPDATE stars SET ${label} = :value WHERE id = :starID`, { value: data, starID: id })
				}

				return {
					reload,
					content: content ? content : data,
					similar: await getSimilarStars(db, id)
				}
			} else if (ignore != undefined) {
				await db.query('UPDATE stars SET autoTaggerIgnore = :ignore WHERE id = :starID', {
					ignore,
					starID: id
				})

				return (await db.query('SELECT * FROM stars WHERE id = :starID LIMIT 1', { starID: id }))[0]
			}
		})
	)

	// add starAlias (with name)
	fastify.post(
		'/:id/alias',
		handler(async (db, { id }, body) => {
			const { alias } = schemaHandler(
				Joi.object({
					alias: Joi.string().required()
				}),
				body
			)

			if (alias !== undefined) {
				if (!(await starExists(db, alias))) {
					await db.query('INSERT INTO staralias(starID, name) VALUES(:starID, :alias)', {
						starID: id,
						alias
					})
				} else {
					throw new Error('Star already exists')
				}
			}
		})
	)

	// remove starAlias (from name)
	fastify.delete(
		'/:id/alias',
		handler(async (db, { id }, body) => {
			const { alias } = schemaHandler(
				Joi.object({
					alias: Joi.string().required()
				}),
				body
			)

			if (alias !== undefined) {
				await db.query('DELETE FROM staralias WHERE alias = :alias AND starID = :starID', { alias, starID: id })
			}
		})
	)

	fastify.delete(
		'/:id',
		handler(async (db, { id }) => {
			await db.query('DELETE FROM stars WHERE id = :starID', { starID: id })
			// No need to delete related tables, they will be automatically removed
		})
	)

	fastify.get(
		'/:id/video',
		handler(async (db, { id }) => {
			return await db.query(
				'SELECT videos.id, videos.name, videos.date, videos.path as fname, websites.name AS website, sites.name AS site, COALESCE(starAge * 365, DATEDIFF(videos.date, stars.birthdate)) AS age FROM videos LEFT JOIN videosites ON videos.id = videosites.videoID LEFT JOIN sites ON videosites.siteID = sites.id JOIN videostars ON videos.id = videostars.videoID JOIN stars ON videostars.starID = stars.id JOIN videowebsites ON videos.id = videowebsites.videoID JOIN websites ON videowebsites.websiteID = websites.id WHERE videostars.starID = :starID ORDER BY age',
				{ starID: id }
			)
		})
	)

	fastify.post(
		'/:id/freeones',
		handler(async (db, { id }, body) => {
			const { star } = schemaHandler(
				Joi.object({
					star: Joi.string()
				}),
				body
			)

			const profileLink = await getProfileLink(db, id, star)
			if (profileLink) {
				const info = await getProfileData(profileLink)

				if (info) {
					const starDetails = (await db.query('SELECT * FROM stars WHERE id = :starID', { starID: id }))[0]

					if (!starDetails.birthdate && info.birthdate) {
						await setProfileData(db, id, 'birthdate', info.birthdate)
					}

					if (!starDetails.country && info.country) {
						await setProfileData(db, id, 'country', info.country)
					}

					if (!starDetails.ethnicity && info.ethnicity) {
						await setProfileData(db, id, 'ethnicity', info.ethnicity)
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

	fastify.delete(
		'/:id/freeones',
		handler(async (db, { id }) => {
			await db.query(
				'UPDATE stars SET haircolor = NULL, eyecolor = NULL, breast = NULL, ethnicity = NULL, country = NULL, birthdate = NULL, height = NULL, height = NULL, weight = NULL WHERE id = :starID',
				{ starID: id }
			)
		})
	)
}
