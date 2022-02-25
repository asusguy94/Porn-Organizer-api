import { FastifyInstance } from 'fastify'
import Joi from 'joi'

import { sql, VIDEO_ORDER_ASC } from '../../db'
import { formatDate } from '../../helper'
import { generateStarName } from '../../generate'

import handler from '../../middleware/handler'
import schemaHandler from '../../middleware/schema'
import { aliasExists, getAliasAsStarID } from '../../helper.db'

export default async (fastify: FastifyInstance) => {
	fastify.get(
		'/',
		handler(
			async (db) =>
				await db.query(sql(`ageInVideo ${VIDEO_ORDER_ASC ? 'ASC' : 'DESC'}, stars.id`, 500), { id: 0 })
		)
	)

	fastify.put(
		'/:id',
		handler(async (db, { id }, body) => {
			const value = schemaHandler(
				Joi.object({
					title: Joi.string(),
					starAge: Joi.number().integer().min(18).max(99).allow('', 0),
					plays: Joi.number().integer().min(0)
				}).xor('title', 'starAge', 'plays'),
				body
			)

			if ('title' in value) {
				await db.query('UPDATE videos SET name = :title WHERE id = :videoID', {
					title: value.title,
					videoID: id
				})
			} else if ('starAge' in value) {
				if (!value.starAge) {
					await db.query('UPDATE videos SET starAge = NULL WHERE id = :videoID', { videoID: id })
				} else {
					await db.query('UPDATE videos SET starAge = :age WHERE id = :videoID', {
						age: value.starAge,
						videoID: id
					})
				}
			} else if ('plays' in value) {
				if (!value.plays) {
					// Reset PLAYS
					await db.query('DELETE FROM plays WHERE videoID = :videoID', { videoID: id })
				} else {
					// Add PLAY
					await db.query('INSERT INTO plays(videoID) VALUES(:videoID)', { videoID: id })
				}
			}
		})
	)

	fastify.post(
		'/:id/attribute',
		handler(async (db, { id }, body) => {
			const { attributeID } = schemaHandler(
				Joi.object({
					attributeID: Joi.number().integer().required()
				}),
				body
			)

				const insert = await db.query(
					'INSERT INTO videoattributes(videoID, attributeID) VALUES(:videoID, :attributeID)',
					{
						videoID: id,
						attributeID
					}
				)

				return { id: insert.insertId, videoID: id, attributeID }
		})
	)

	fastify.post(
		'/:id/location',
		handler(async (db, { id }, body) => {
			const { locationID } = schemaHandler(
				Joi.object({
					locationID: Joi.number().integer().required()
				}),
				body
			)

				const insert = await db.query(
					'INSERT INTO videolocations(videoID, locationID) VALUES(:videoID, :locationID)',
					{
						videoID: id,
						locationID
					}
				)

				return { id: insert.insertId, videoID: id, locationID }
		})
	)

	fastify.post(
		'/:id/bookmark',
		handler(async (db, { id }, body) => {
			const { categoryID, time } = schemaHandler(
				Joi.object({
					categoryID: Joi.number().integer().min(1).required(),
					time: Joi.number().integer().min(1).required()
				}),
				body
			)

				const insert = await db.query(
					'INSERT INTO bookmarks(videoID, categoryID, start) VALUES(:videoID, :categoryID, :time)',
					{
						videoID: id,
						categoryID,
						time
					}
				)

				return { id: insert.insertId, videoID: id, categoryID, time, starID: 0 }
		})
	)

	fastify.delete(
		'/:id/bookmark',
		handler(async (db, { id }) => {
			await db.query('DELETE FROM bookmarks WHERE videoID = :videoID', { videoID: id })
		})
	)

	fastify.get(
		'/:id',
		handler(async (db, { id }) => {
			const video = (
				await db.query(
					'SELECT videos.*, (SELECT COUNT(*) FROM plays WHERE plays.videoID = videos.id) as plays, (SELECT name FROM videowebsites JOIN websites ON videowebsites.websiteID = websites.id WHERE videoID = videos.id) as website FROM videos WHERE id = :videoID LIMIT 1',
					{ videoID: id }
				)
			)[0]

			// Ignore StarAge
			delete video.starAge

			video.star = generateStarName(video.path)

			// Format Date
			const date_added = formatDate(video.added)
			const date_published = formatDate(video.date)

			// change 'date(s)' to object
			video.date = {
				added: date_added,
				published: date_published
			}
			delete video.date_published
			delete video.added

			// change 'path(s)' to object
			video.path = {
				file: video.path,
				stream: `${video.path.split('.').slice(0, -1).join('.')}/playlist.m3u8`,
				dash: `${video.path.split('.').slice(0, -1).join('.')}/playlist.mpd`
			}

			video.locations = await db.query(
				'SELECT locations.name, videolocations.id FROM videolocations JOIN locations ON videolocations.locationID = locations.id WHERE videoID = :videoID',
				{ videoID: id }
			)

			video.attributes = await db.query(
				'SELECT attributes.name, videoattributes.id FROM videoattributes JOIN attributes ON videoattributes.attributeID = attributes.id WHERE videoID = :videoID',
				{ videoID: id }
			)

			const site = (
				await db.query(
				'SELECT name FROM videosites JOIN sites ON videosites.siteID = sites.id WHERE videoID = :videoID LIMIT 1',
				{ videoID: id }
			)
			)[0]
			video.subsite = site ? site.name : null

			// Get NextID
			let nextIDs: any[] = []
			if (VIDEO_ORDER_ASC) {
				nextIDs = await db.query(sql('ageInVideo, stars.id'), { id })
			} else {
				nextIDs = await db.query(sql('ageInVideo DESC, stars.id'), { id })
			}

			let match = false
			nextIDs.forEach((item) => {
				if (!match) {
					if (item.id == id) match = true
				} else if (!video.nextID) {
					video.nextID = item.id
				}
			})

			return video
		})
	)

	fastify.get(
		'/:id/star',
		handler(async (db, { id }) => {
			const star = (
				await db.query(
					'SELECT stars.id, stars.name, stars.image, COALESCE(starAge * 365, DATEDIFF(videos.date, stars.birthdate)) AS ageInVideo, (SELECT COUNT(*) as total FROM videostars WHERE starID = stars.id) as numVideos FROM stars JOIN videostars ON stars.id = videostars.starID JOIN videos ON videostars.videoID = videos.id WHERE videostars.videoID = :videoID LIMIT 1',
				{ videoID: id }
			)
			)[0]

			if (star) {
				return star
			} else {
				throw new Error('Video does not have any star')
			}
		})
	)

	fastify.post(
		'/:id/star',
		handler(async (db, { id }, body) => {
			const { name } = schemaHandler(
				Joi.object({
					name: Joi.string().min(2).required()
				}),
				body
			)

			let starID
			if (!(await aliasExists(db, name))) {
				await db.query('INSERT INTO stars(name) VALUES(:star)', { star: name }).catch(() => {})

				starID = (await db.query('SELECT id, image FROM stars WHERE name = :star LIMIT 1', { star: name }))[0]
					.id
			} else {
				starID = await getAliasAsStarID(db, name)
			}

				// Insert VIDEOSTAR into table
				await db.query('INSERT INTO videostars(starID, videoID) VALUES(:starID, :videoID)', {
					videoID: id,
					starID
				})

			return (
				await db.query(
					'SELECT stars.id, stars.name, stars.image, COALESCE(starAge * 365, DATEDIFF(videos.date, stars.birthdate)) AS ageInVideo, (SELECT COUNT(*) FROM videostars WHERE starID = stars.id) as numVideos FROM stars JOIN videostars ON stars.id = videostars.starID JOIN videos ON videostars.videoID = videos.id WHERE videostars.videoID = :videoID LIMIT 1',
					{ videoID: id }
				)
			)[0]
		})
	)

	fastify.delete(
		'/:id/star/:starID',
		handler(async (db, { id, starID }) => {
			await db.query('DELETE FROM videostars WHERE videoID = :videoID AND starID = :starID', {
				videoID: id,
				starID
			})
		})
	)

	fastify.get(
		'/:id/bookmark',
		handler(
			async (db, { id }) =>
				await db.query(
					'SELECT bookmarks.id, categories.name, bookmarks.start FROM bookmarks JOIN categories ON bookmarks.categoryID = categories.id WHERE videoID = :videoID ORDER BY start',
					{ videoID: id }
				)
		)
	)
}
