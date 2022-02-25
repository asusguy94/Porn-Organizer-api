import { FastifyInstance } from 'fastify'
import Joi from 'joi'

import fs from 'fs'
import rimraf from 'rimraf'

import { noExt, dirOnly, removeThumbnails, isNewDate, formatDate, getResizedThumb, extOnly } from '../../helper'
import { generateDate, generateTitle, generateSite } from '../../generate'
import { getWebsiteID, getSiteID } from '../../helper.db'

import handler from '../../middleware/handler'
import schemaHandler from '../../middleware/schema'

export default async (fastify: FastifyInstance) => {
	fastify.post(
		'/add',
		handler(async (db, {}, body) => {
			const { videos } = schemaHandler(
				Joi.object({
					videos: Joi.array().required()
				}),
				body
			)

			for (let i = 0; i < videos.length; i++) {
				const video = videos[i]

				// Insert into VIDEOS-table
				await db.query('INSERT INTO videos(path, name, date) VALUES(:path, :name, :date)', {
					path: video.path,
					name: video.title,
					date: video.date
				})

				// First video from new Website
				if (!(await getWebsiteID(db, video.website))) {
					// Create Website
					await db.query('INSERT INTO websites(name) VALUES(:website)', {
						website: video.website
					})
				}

				// First video from Site AND Site is NOT EMPTY
				if (!(await getSiteID(db, video.site)) && video.site.length) {
					// EVERY Site must have a website, hence it is not required to test for this

					// Create WebsiteSite
					await db.query('INSERT INTO sites(name, websiteID) VALUES(:site, :websiteID)', {
						site: video.site,
						websiteID: await getWebsiteID(db, video.website)
					})
				}
			}
		})
	)

	fastify.put(
		'/:id',
		handler(async (db, { id }, body) => {
			const { path, date } = schemaHandler(
				Joi.object({
					path: Joi.string(),
					date: Joi.boolean()
				}),
				body
			)

			if (path !== undefined) {
				const oldPath = (
					await db.query('SELECT path FROM videos WHERE id = :videoID LIMIT 1', { videoID: id })
				)[0].path
				if (oldPath) {
					await db
						.query('UPDATE videos SET path = :newPath WHERE id = :videoID', {
							newPath: path,
							videoID: id
				})
						.then(() => {
						// Rename File
							fs.renameSync(`./public/videos/${oldPath}`, `./public/videos/${path}`)
							fs.renameSync(`./public/videos/${noExt(oldPath)}`, `./public/videos/${noExt(path)}`)
						})

						// Update Database
					} else {
						throw new Error('Invalid videoID')
					}
			} else if (date !== undefined) {
				const video = (
					await db.query('SELECT path, date FROM videos WHERE id = :videoID LIMIT 1', {
					videoID: id
				})
				)[0]
				if (video) {
					const { path, date } = video
					const fileDate = generateDate(path)

					if (isNewDate(date, fileDate)) {
						await db.query('UPDATE videos SET date = :videoDate WHERE id = :videoID', {
							videoDate: fileDate,
							videoID: id
						})
					}

					const stars = (
						await db.query(
						'SELECT COALESCE(starAge * 365, DATEDIFF(videos.date, stars.birthdate)) AS ageInVideo FROM stars JOIN videostars ON stars.id = videostars.starID JOIN videos ON videostars.videoID = videos.id WHERE videostars.videoID = :videoID LIMIT 1',
						{ videoID: id }
					)
					)[0]

					return { date: formatDate(fileDate), age: stars.ageInVideo }
				} else {
					throw new Error('Invalid videoID')
				}
			} else {
				// Refresh Video

				// Update Database
				await db.query('UPDATE videos SET duration = 0, height = 0 WHERE id = :videoID', { videoID: id })

				// Remove Files
				removeThumbnails(id)
			}
		})
	)

	fastify.delete(
		'/:id',
		handler(async (db, { id }) => {
			const video = (await db.query('SELECT path FROM videos WHERE id = :videoID LIMIT 1', { videoID: id }))[0]
			if (video.path) {
				const videoPath = video.path
				const hlsDir = noExt(videoPath)

				// No need to delete related tables, they will be automatically removed
				await db.query('DELETE FROM videos WHERE id = :videoID', { videoID: id }).then(() => {
					removeThumbnails(id)

					// remove video-file
					fs.unlink(`./public/videos/${videoPath}`, () => {})

					// remove stream-files
					rimraf(`./public/videos/${hlsDir}`, () => {})
				})
			} else {
				throw new Error('Invalid videoID')
			}
		})
	)

	fastify.post(
		'/',
		handler(async (db) => {
			const filesDB: any[] = await db.query('SELECT * FROM videos')
			const filesArr = filesDB.map((video) => video.path)

			const paths = await fs.promises.readdir('./public/videos')

			const newFiles = []
			for (let i = 0; i < paths.length; i++) {
				const path = paths[i]

				if (path.includes('_')) continue

				const dirPath = `./public/videos/${path}`
				if ((await fs.promises.lstat(dirPath)).isDirectory()) {
					const files = await fs.promises.readdir(dirPath)
					for (let j = 0; j < files.length; j++) {
						const file = files[j]

						const filePath = `${dirPath}/${file}`

						const dir = dirOnly(dirPath)
						if (
							!filesArr.includes(`${dir}/${file}`) &&
							(await fs.promises.lstat(filePath)).isFile() &&
							extOnly(filePath) === '.mp4' // Prevent random files from being imported!
						) {
							newFiles.push({
								path: `${dir}/${file}`,
								website: dir,
								date: generateDate(filePath),
								site: generateSite(filePath),
								title: generateTitle(filePath)
							})
						}
					}
				}
			}

			const newFilesSliced = newFiles.slice(0, 30)
			return { files: newFilesSliced, pages: Math.ceil(newFiles.length / newFilesSliced.length) }
		})
	)

	fastify.get(
		'/:id',
		handler(async ({}, { id }) => {
			return fs.createReadStream(`./public/images/videos/${id}.jpg`)
		})
	)

	fastify.get(
		'/:id/thumb',
		handler(async ({}, { id }) => {
			return fs.createReadStream(`./public/images/videos/${await getResizedThumb(id)}`)
		})
	)

	fastify.get(
		'/:id/vtt',
		handler(async (_db, { id }) => fs.createReadStream(`./public/vtt/${id}.vtt`))
	)

	fastify.get(
		'/:id/vtt/thumb',
		handler(async (_db, { id }) => fs.createReadStream(`./public/vtt/${id}.jpg`))
	)
}
