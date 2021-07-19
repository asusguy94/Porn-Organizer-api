import express from 'express'
const router = express.Router()
import Joi from 'joi'

import fs from 'fs'
import rimraf from 'rimraf'

import { noExt, dirOnly, removeThumbnails, isNewDate, formatDate } from '../../helper'
import { generateDate, generateTitle, generateSite } from '../../generate'
import { getWebsiteID, getSiteID } from '../../helper.db'

import handler from '../../middleware/handler'
import schemaHandler from '../../middleware/schema'

router.post(
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

			const websiteID = await getWebsiteID(db, video.website)
			const siteID = await getSiteID(db, video.site)

			// Insert into VIDEOS-table
			await db.query('INSERT INTO videos(path, name, date) VALUES(:path, :name, :date)', {
				path: video.path,
				name: video.title,
				date: video.date
			})

			// First video from new Website
			if (!websiteID) {
				// Create Website
				await db.query('INSERT INTO websites(name) VALUES(:website)', {
					website: video.website
				})
			}

			// First video from Site AND Site is NOT EMPTY
			if (!siteID && video.site.length) {
				// EVERY Site must have a website, hence it is not required to test for this

				// Create WebsiteSite
				await db.query('INSERT INTO sites(name, websiteID) VALUES(:site, :websiteID)', {
					site: video.site,
					websiteID
				})
			}
		}
	})
)

router.put(
	'/:id',
	handler(async (db, { id }, body) => {
		const value = schemaHandler(
			Joi.object({
				path: Joi.string(),
				date: Joi.boolean()
			}),
			body
		)

		if ('path' in value) {
			const newPath = value.path

			const result = await db.query('SELECT COUNT(*) as total FROM videos WHERE path = :path LIMIT 1', {
				path: newPath
			})
			if (!result[0].total) {
				const video = await db.query('SELECT path FROM videos WHERE id = :videoID LIMIT 1', { videoID: id })
				if (video[0].path) {
					const oldPath = video[0].path

					// Rename File
					fs.renameSync(`./public/videos/${oldPath}`, `./public/videos/${newPath}`)
					fs.renameSync(`./public/videos/${noExt(oldPath)}`, `./public/videos/${noExt(newPath)}`)

					// Update Database
					await db.query('UPDATE videos SET path = :newPath WHERE id = :videoID', { newPath, videoID: id })
				} else {
					throw new Error('Invalid videoID')
				}
			} else {
				throw new Error('File already exists')
			}
		} else if ('date' in value) {
			const videos = await db.query('SELECT path, date FROM videos WHERE id = :videoID LIMIT 1', { videoID: id })
			if (videos[0]) {
				const video = videos[0]

				const { path, date } = video
				const fileDate = generateDate(path)

				if (isNewDate(date, fileDate)) {
					await db.query('UPDATE videos SET date = :videoDate WHERE id = :videoID', {
						videoDate: fileDate,
						videoID: id
					})
				}

				const stars = await db.query(
					'SELECT COALESCE(starAge * 365, DATEDIFF(videos.date, stars.birthdate)) AS ageInVideo FROM stars JOIN videostars ON stars.id = videostars.starID JOIN videos ON videostars.videoID = videos.id WHERE videostars.videoID = :videoID LIMIT 1',
					{ videoID: id }
				)

				return { date: formatDate(fileDate), age: stars[0].ageInVideo }
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

router.delete(
	'/:id',
	handler(async (db, { id }) => {
		const video = await db.query('SELECT path FROM videos WHERE id = :videoID LIMIT 1', { videoID: id })
		if (video[0].path) {
			const videoPath = video[0].path
			const hlsDir = noExt(videoPath)

			const result = await db.query('SELECT COUNT(*) as total FROM videostars WHERE videoID = :videoID LIMIT 1', {
				videoID: id
			})
			if (!result[0].total) {
				await db.query('DELETE FROM videos WHERE id = :videoID', { videoID: id })
				await db.query('DELETE FROM videosites WHERE videoID = :videoID', { videoID: id })
				await db.query('DELETE FROM videowebsites WHERE videoID = :videoID', { videoID: id })
				await db.query('DELETE FROM videoattributes WHERE videoID = :videoID', { videoID: id })
				await db.query('DELETE FROM videolocations WHERE videoID = :videoID', { videoID: id })
				await db.query('DELETE FROM plays WHERE videoID = :videoID', { videoID: id })

				removeThumbnails(id)

				fs.unlink(`./public/videos/${videoPath}`, () => {})
				rimraf(`./public/videos/${hlsDir}`, () => {})
			} else {
				throw 'Please remove the star from the video first'
			}
		} else {
			throw new Error('Invalid videoID')
		}
	})
)

router.post(
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
					if (!filesArr.includes(`${dir}/${file}`) && (await fs.promises.lstat(filePath)).isFile()) {
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

		return newFiles.slice(0, 30)
	})
)

export default router
