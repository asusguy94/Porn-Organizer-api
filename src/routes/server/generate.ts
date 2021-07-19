import express from 'express'
const router = express.Router()

import { fileExists, getClosestQ } from '../../helper'
import { getWebsiteID, getSiteID, getStarID, getAliasAsStarID, getIgnoredStar, getIgnoredStarID } from '../../helper.db'
import { duration as videoDuration, height as videoHeight, extractFrame } from '../../ffmpeg'
import { generateSite, generateStarName, generateWebsite } from '../../generate'
import { getSetting } from '../../settings'

import handler from '../../middleware/handler'

router.post(
	'/thumb',
	handler(async (db) => {
		const videos = await db.query('SELECT id, path FROM videos')
		db.end()

		console.log('Generating THUMBNAILS')
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
					console.log('Generating HIGHRES', video.id)

					await extractFrame(absoluteVideoPath, absoluteImagePath)
				}
				if (!(await fileExists(imagePath_low))) {
					console.log('Generating LOWRES', video.id)

					await extractFrame(absoluteVideoPath, absoluteImagePath_low, 31, width)
				}
			}
		}
		console.log('Finished generating THUMBNAILS')
	})
)

router.post(
	'/meta',
	handler(async (db) => {
		async function websiteRelationExists(db: any, videoID: number, websiteID: number) {
			const result = await db.query(
				'SELECT COUNT(*) as total FROM videowebsites WHERE websiteID = :websiteID AND videoID = :videoID LIMIT 1',
				{
					websiteID,
					videoID
				}
			)

			return result[0].total > 0
		}

		async function siteRelationExists(db: any, videoID: number, siteID: number) {
			const result = await db.query(
				'SELECT COUNT(*) as total FROM videosites WHERE siteID = :siteID AND videoID = :videoID LIMIT 1',
				{
					siteID,
					videoID
				}
			)

			return result[0].total > 0
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
				await db.query('INSERT INTO videosites(videoID, siteID) VALUES(:videoID, :siteID)', { videoID, siteID })
			}
		}

		async function starRelationExists(db: any, videoID: number) {
			const result = await db.query('SELECT COUNT(*) as total FROM videostars WHERE videoID = :videoID LIMIT 1', {
				videoID
			})

			return result[0].total > 0
		}

		async function videoStarExists(db: any, videoID: number, star: string) {
			const starID = getStarID(db, star)

			const result = await db.query(
				'SELECT COUNT(*) as total FROM videostars WHERE videoID = :videoID AND starID = :starID LIMIT 1',
				{
					videoID,
					starID
				}
			)

			return result[0].total > 0
		}

		async function videoStarAliasExists(db: any, videoID: number, alias: string) {
			const starID = getAliasAsStarID(db, alias)

			const result = await db.query(
				'SELECT COUNT(*) as total FROM videostars WHERE videoID = :videoID AND starID = :starID LIMIT 1',
				{
					videoID,
					starID
				}
			)

			return result[0].total > 0
		}

		async function starExists(db: any, star: string) {
			const result = await db.query('SELECT COUNT(*) as total FROM stars WHERE name = :star LIMIT 1', { star })

			return result[0].total > 0
		}

		async function starAliasExists(db: any, alias: string) {
			const result = await db.query('SELECT COUNT(*) as total FROM staralias WHERE name = :alias LIMIT 1', {
				alias
			})

			return result[0].total > 0
		}

		async function addVideoStar(db: any, videoID: number, starID: number) {
			console.log('Adding VideoStar')

			await db.query('INSERT INTO videostars(videoID, starID) VALUES(:videoID, :starID)', { videoID, starID })
		}

		async function checkStarRelation(db: any, videoID: number, videoPath: string) {
			if (!(await starRelationExists(db, videoID))) {
				const star = generateStarName(videoPath)

				if (!(await videoStarExists(db, videoID, star)) && !(await videoStarAliasExists(db, videoID, star))) {
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

		console.log('Updating DURATION & HEIGHT')
		const fixVideos = await db.query('SELECT id, path FROM videos WHERE duration = 0 OR height = 0')
		for (let i = 0; i < fixVideos.length; i++) {
			const video = fixVideos[i]
			const videoPath = `videos/${video.path}`
			const absoluteVideoPath = `./public/${videoPath}`

			if (await fileExists(videoPath)) {
				const duration = await videoDuration(absoluteVideoPath)
				const height = await videoHeight(absoluteVideoPath)

				await db.query('UPDATE videos SET duration = :duration, height = :height WHERE id = :videoID', {
					videoID: video.id,
					duration,
					height: getClosestQ(height)
				})
			}
		}
		console.log('Finished updating DURATION & HEIGHT')

		const videos = await db.query('SELECT id, path FROM videos')
		console.log('Updating STARS & WEBSITE/SITE')
		for (let i = 0; i < videos.length; i++) {
			const video = videos[i]
			const videoPath = `videos/${video.path}`

			if (await fileExists(videoPath)) {
				await checkWebsiteRelation(db, video.id, video.path)
				await checkStarRelation(db, video.id, video.path)
			}
		}
		console.log('Finished updating STARS & WEBSITE/SITE')

		console.log('FINISHED GENERATING METADATA')
	})
)

router.post(
	'/vtt',
	handler(async (db) => {
		const videos = await db.query('SELECT id, path FROM videos')
		db.end()

		console.log('Generating VTT')
		for (let i = 0; i < videos.length; i++) {
			const video = videos[i]
			const videoPath = `videos/${video.path}`
			//const imagePath = `images/videos/${video.id}.jpg`
			const vttPath = `vtt/${video.id}.vtt`

			//const absoluteVideoPath = `./public/${videoPath}`
			//const absoluteImagePath = `./public/${imagePath}`
			//const absoluteVttPath = `./public/${vttPath}`

			if (await fileExists(videoPath)) {
				if (!(await fileExists(vttPath))) {
					// extract images
					// generate tileset from images
					// remove images
					// generate vtt from tileset
				}
			}
		}
		console.log('Finished generating VTT')
	})
)

export default router
