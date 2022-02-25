import { FastifyInstance } from 'fastify'

import { fileExists, getClosestQ, rebuildVideoFile } from '../../helper'
import {
	getWebsiteID,
	getSiteID,
	getStarID,
	getAliasAsStarID,
	getIgnoredStar,
	getIgnoredStarID,
	starExists
} from '../../helper.db'
import { duration as videoDuration, height as videoHeight, extractFrame, extractVtt } from '../../ffmpeg'
import { generateSite, generateStarName, generateWebsite } from '../../generate'
import { getSetting } from '../../settings'

import handler from '../../middleware/handler'
import { logger } from '../../middleware/logger'

export default async (fastify: FastifyInstance) => {
	fastify.post(
		'/thumb',
		handler(async (db) => {
			const videos = await db.query('SELECT id, path FROM videos WHERE NOT (duration = 0 OR height = 0)')
			db.end()

			logger('Generating THUMBNAILS')
			const width = await getSetting('thumbnail_res')
			for (let i = 0; i < videos.length; i++) {
				const video = videos[i]
				const videoPath = `videos/${video.path}`
				const imagePath = `images/videos/${video.id}.jpg`
				const imagePath_low = `images/videos/${video.id}-${width}.jpg`

				const absoluteVideoPath = `./public/${videoPath}`
				const absoluteImagePath = `./public/${imagePath}`
				const absoluteImagePath_low = `./public/${imagePath_low}`

				if (await fileExists(videoPath)) {
					// Check if thumbnail exists
					if (!(await fileExists(imagePath))) {
						logger(`Generating HIGHRES ${video.id}`)

						await extractFrame(absoluteVideoPath, absoluteImagePath)
					}
					if (!(await fileExists(imagePath_low))) {
						logger(`Generating LOWRES ${video.id}`)

						await extractFrame(absoluteVideoPath, absoluteImagePath_low, 31, width)
					}
				}
			}
			logger('Finished generating THUMBNAILS')
		})
	)

	fastify.post(
		'/meta',
		handler(async (db) => {
			async function websiteRelationExists(db: any, videoID: number, websiteID: number) {
				return (
					(
						await db.query(
					'SELECT COUNT(*) as total FROM videowebsites WHERE websiteID = :websiteID AND videoID = :videoID LIMIT 1',
					{
						websiteID,
						videoID
					}
				)
					)[0].total > 0
				)
			}

			async function siteRelationExists(db: any, videoID: number, siteID: number) {
				return (
					(
						await db.query(
					'SELECT COUNT(*) as total FROM videosites WHERE siteID = :siteID AND videoID = :videoID LIMIT 1',
					{
						siteID,
						videoID
					}
				)
					)[0].total > 0
				)
			}

			async function checkWebsiteRelation(db: any, videoID: number, videoPath: string) {
				const website = generateWebsite(videoPath)
				const site = generateSite(videoPath)

				const websiteID = await getWebsiteID(db, website)
				const siteID = await getSiteID(db, site)

				// Add VideoWebsite
				if (websiteID && !(await websiteRelationExists(db, videoID, websiteID))) {
					await db.query('INSERT INTO videowebsites(videoID, websiteID) VALUES(:videoID, :websiteID)', {
						videoID,
						websiteID
					})
				}

				// Add VideoSite
				if (siteID && !(await siteRelationExists(db, videoID, siteID))) {
					await db.query('INSERT INTO videosites(videoID, siteID) VALUES(:videoID, :siteID)', {
						videoID,
						siteID
					})
				}
			}

			async function starRelationExists(db: any, videoID: number) {
				return (
					(
						await db.query('SELECT COUNT(*) as total FROM videostars WHERE videoID = :videoID LIMIT 1', {
						videoID
						})
					)[0].total > 0
				)
			}

			async function videoStarExists(db: any, videoID: number, star: string) {
				const starID = getStarID(db, star)

				return (
					(
						await db.query(
					'SELECT COUNT(*) as total FROM videostars WHERE videoID = :videoID AND starID = :starID LIMIT 1',
					{
						videoID,
						starID
					}
				)
					)[0].total > 0
				)
			}

			async function videoStarAliasExists(db: any, videoID: number, alias: string) {
				return (
					(
						await db.query(
					'SELECT COUNT(*) as total FROM videostars WHERE videoID = :videoID AND starID = :starID LIMIT 1',
					{
						videoID,
								starID: await getAliasAsStarID(db, alias)
					}
				)
					)[0].total > 0
				)
			}

			async function starAliasExists(db: any, alias: string) {
				return (
					(
						await db.query('SELECT COUNT(*) as total FROM staralias WHERE name = :alias LIMIT 1', {
					alias
				})
					)[0].total > 0
				)
			}

			async function addVideoStar(db: any, videoID: number, starID: number) {
				logger('Adding VideoStar')

				await db.query('INSERT INTO videostars(videoID, starID) VALUES(:videoID, :starID)', { videoID, starID })
			}

			async function checkStarRelation(db: any, videoID: number, videoPath: string) {
				if (!(await starRelationExists(db, videoID))) {
					const star = generateStarName(videoPath)

					if (
						!(await videoStarExists(db, videoID, star)) &&
						!(await videoStarAliasExists(db, videoID, star))
					) {
						if (
							!(await getIgnoredStar(db, star)) &&
							!(await getIgnoredStarID(db, await getAliasAsStarID(db, star)))
						) {
							if (await starExists(db, star)) {
								await addVideoStar(db, videoID, await getStarID(db, star))
							} else if (await starAliasExists(db, star)) {
								await addVideoStar(db, videoID, await getAliasAsStarID(db, star))
							}
						}
					}
				}
			}

			logger('Updating DURATION & HEIGHT')
			const fixVideos = await db.query('SELECT id, path FROM videos WHERE duration = 0 OR height = 0')
			for (let i = 0; i < fixVideos.length; i++) {
				const video = fixVideos[i]
				const videoPath = `videos/${video.path}`
				const absoluteVideoPath = `./public/${videoPath}`

				if (await fileExists(videoPath)) {
					logger(`Rebuild: ${video.id}`)
					await rebuildVideoFile(absoluteVideoPath).then(async () => {
					const duration = await videoDuration(absoluteVideoPath)
					const height = await videoHeight(absoluteVideoPath)

						logger(`Refreshing ${video.path}`)
					await db.query('UPDATE videos SET duration = :duration, height = :height WHERE id = :videoID', {
						videoID: video.id,
							height: getClosestQ(height),
							duration
						})
					})
				}
			}
			logger('Finished updating DURATION & HEIGHT')

			const videos = await db.query('SELECT id, path FROM videos')
			logger('Updating STARS & WEBSITE/SITE')
			for (let i = 0; i < videos.length; i++) {
				const video = videos[i]
				const videoPath = `videos/${video.path}`

				if (await fileExists(videoPath)) {
					await checkWebsiteRelation(db, video.id, video.path)
					await checkStarRelation(db, video.id, video.path)
				}
			}
			logger('Finished updating STARS & WEBSITE/SITE')

			logger('FINISHED GENERATING METADATA')
		})
	)

	fastify.post(
		'/vtt',
		handler(async (db) => {
			const videos = await db.query('SELECT id, path FROM videos WHERE NOT (duration = 0 OR height = 0)')
			db.end()

			logger('Generating VTT')
			for (let i = 0; i < videos.length; i++) {
				const video = videos[i]

				const videoPath = `videos/${video.path}`
				const imagePath = `vtt/${video.id}.jpg`
				const vttPath = `vtt/${video.id}.vtt`

				const absoluteVideoPath = `./public/${videoPath}`
				const absoluteImagePath = `./public/${imagePath}`

				if ((await fileExists(videoPath)) && !(await fileExists(vttPath))) {
					logger(`Generating VTT: ${video.id}`)
					await extractVtt(absoluteVideoPath, absoluteImagePath, video.id)
				}
			}
			logger('Finished generating VTT')
		})
	)
}
