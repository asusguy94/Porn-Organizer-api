import fs from 'fs'
import path from 'path'
import fetch from 'node-fetch'
import dayjs from 'dayjs'
import rimraf from 'rimraf'
import ffmpeg from 'fluent-ffmpeg'

import { logger } from './middleware/logger'

import { settings as settingsConfig } from './config'

import { getSetting } from './settings'

const getClosest = (search: number, arr: number[]) => {
	return arr.reduce((a, b) => {
		const aDiff = Math.abs(a - search)
		const bDiff = Math.abs(b - search)

		if (aDiff === bDiff) {
			return a > b ? a : b
		} else {
			return bDiff < aDiff ? b : a
		}
	})
}

export const downloader = async (url: string, path: string) => {
	const response = await fetch(url)
	const buffer = await response.buffer()
	await fs.promises.writeFile(`./${path}`, buffer)
}

export const writeToFile = async (path: string, content: string) => fs.promises.appendFile(path, content)

export const dirOnly = (dir: string, root = false) => (root ? path.parse(dir).dir : path.parse(dir).name)

export const extOnly = (dir: string) => path.parse(dir).ext

export const noExt = (dir: string) => {
	const parsed = path.parse(dir)

	return parsed.dir ? `${parsed.dir}/${parsed.name}` : parsed.name
}

export const removeThumbnails = async (videoID: number) => {
	// Remove Images
	fs.unlink(`./public/images/videos/${videoID}.jpg`, () => {})
	fs.unlink(`./public/images/videos/${videoID}-${await getSetting('thumbnail_res')}.jpg`, () => {})

	// Remove Previews
	fs.unlink(`./public/images/thumbnails/${videoID}.jpg`, () => {})
	fs.unlink(`./public/vtt/${videoID}.vtt`, () => {})
	fs.unlink(`./public/vtt/${videoID}.jpg`, () => {})
}

// This requires a specific pipeline, as such it is using callbacks
export const rebuildVideoFile = async (src: string) => {
	const { dir, ext, name } = path.parse(src)
	const newSrc = `${dir}/${name}_${ext}`

	return new Promise<void | Error>((resolve, reject) => {
		fs.promises.rename(src, newSrc).then(async () => {
			ffmpeg(newSrc)
				.videoCodec('copy')
				.audioCodec('copy')
				.output(src)
				.on('end', () => fs.unlink(newSrc, () => resolve()))
				.on('error', (err) => reject(err))
				.run()
		})
	})
}

export const removeStreamFolder = (path: string) => rimraf(path, () => {})

export const getClosestQ = (quality: number) => {
	if (quality === 396) {
		return 480
	}

	return getClosest(quality, settingsConfig.qualities)
}

export const fileExists = async (path: string) => {
	return new Promise<boolean>((resolve) => {
		fs.access(`./public/${path}`, fs.constants.F_OK, (err) => {
			if (!err) {
				resolve(true)
				return
			}

			resolve(false)
		})
	})
}

export const formatDate = (dateStr: string, raw = false) => {
	const date = dayjs(dateStr)

	return raw ? date.format('YYYY-MM-DD') : date.format('D MMMM YYYY')
}

export const formatBreastSize = (input: string) => {
	let breast = input.toUpperCase()

	switch (breast) {
		case 'DD':
			breast = 'E'
			break
		case 'DDD':
		case 'EE':
			breast = 'F'
			break
		case 'EEE':
		case 'FF':
			breast = 'G'
			break
		case 'FFF':
		case 'GG':
			breast = 'H'
			break
		case 'GGG':
		case 'HH':
			breast = 'I'
			break
		case 'HHH':
		case 'II':
			breast = 'J'
			break
		case 'III':
		case 'JJ':
			breast = 'K'
			break
		case 'JJJ':
		case 'KK':
			breast = 'L'
			break
		case 'KKK':
		case 'LL':
			breast = 'M'
			break
		case 'LLL':
		case 'MM':
			breast = 'N'
			break
		case 'MMM':
		case 'NN':
			breast = 'O'
			break
		case 'NNN':
		case 'OO':
			breast = 'P'
			break
		case 'OOO':
		case 'PP':
			breast = 'Q'
			break
		case 'PPP':
		case 'QQ':
			breast = 'R'
			break
		case 'QQQ':
		case 'RR':
			breast = 'S'
			break
		case 'RRR':
		case 'SS':
			breast = 'T'
			break
		case 'SSS':
		case 'TT':
			breast = 'U'
			break
		case 'TTT':
		case 'UU':
			breast = 'V'
			break
		case 'UUU':
		case 'VV':
			breast = 'W'
			break
		case 'VVV':
		case 'WW':
			breast = 'X'
			break
		case 'WWW':
		case 'XX':
			breast = 'Y'
			break
		case 'XXX':
		case 'YY':
			breast = 'Z'
			break
	}

	return breast.trim()
}

export const getCountryCode = async (db: any, label: string) => {
	try {
		const result = (await db.query('SELECT code FROM country WHERE name = :country LIMIT 1', { country: label }))[0]

		return result ? result.code : null
	} catch (err) {
		//@ts-ignore
		logger(err.message)

		return null
	}
}

export const getSimilarStars = async (db: any, starID: number, maxMaxLength = 9) => {
	try {
		const currentStar = (await db.query('SELECT * FROM stars WHERE id = :starID LIMIT 1', { starID }))[0]

		const match_default = 2
		const match_important = 5
		const decimals = 0

		const otherStars: any[] = await db.query('SELECT * FROM stars WHERE NOT id = :starID', { starID })
		const otherStarsArr = otherStars.filter((otherStar) => {
			otherStar.match = 100

			if (currentStar['breast'] && otherStar['breast'] !== currentStar['breast'])
				otherStar.match -= match_important
			if (currentStar['haircolor'] && otherStar['haircolor'] !== currentStar['haircolor'])
				otherStar.match -= match_important
			if (currentStar['eyecolor'] && otherStar['eyecolor'] !== currentStar['eyecolor'])
				otherStar.match -= match_default
			if (currentStar['ethnicity'] && otherStar['ethnicity'] !== currentStar['ethnicity'])
				otherStar.match -= match_important
			if (currentStar['country'] && otherStar['country'] !== currentStar['country'])
				otherStar.match -= match_important
			if (currentStar['height'] && otherStar['height'] !== currentStar['height']) otherStar.match -= match_default
			if (currentStar['weight'] && otherStar['weight'] !== currentStar['weight']) otherStar.match -= match_default
			if (currentStar['start'] && otherStar['start'] !== currentStar['start']) otherStar.match -= match_default
			if (currentStar['end'] && otherStar['end'] !== currentStar['end']) otherStar.match -= match_default
			if (currentStar['birthdate'] && otherStar['birthdate']) {
				const now = dayjs()

				const self = dayjs(currentStar['birthdate'])
				const other = dayjs(otherStar['birthdate'])

				const diff_self = now.diff(self, 'years', true).toFixed(decimals)
				const diff_other = now.diff(other, 'years', true).toFixed(decimals)

				if (diff_self !== diff_other) otherStar.match -= match_important
			}

			return otherStar.match > 0 ? otherStar : null
		})

		return otherStarsArr
			.sort((a, b) => b.match - a.match)
			.map(({ id, name, image, match }) => ({ id, name, image, match }))
			.slice(0, maxMaxLength)
	} catch (err) {
		//@ts-ignore
		logger(err.message)
	}
}

export const isNewDate = (dateStr1: string, dateStr2: string) => {
	const date1 = dayjs(dateStr1)
	const date2 = dayjs(dateStr2)

	return date1.diff(date2) !== 0
}

export const getResizedThumb = async (id: number) => `${id}-${await getSetting('thumbnail_res')}.jpg`

export const toBytes = (amount: number, type: 'kb' | 'mb') => {
	switch (type.toLowerCase()) {
		case 'kb':
			amount *= 1024 ** 1
			break
		case 'mb':
			amount *= 1024 ** 2
			break
		default:
			console.log(`"${type}" is not a recognized type`)
	}

	return amount
}

const calculateTime = (secs: number) =>
	dayjs(0)
		.hour(0)
		.millisecond(secs * 1000)

export const generateVTTData = async (
	videoID: number,
	delayBetweenFrames: number,
	tiles: { rows: number; cols: number },
	dimension: { height: number; width: number }
) => {
	const vtt = `./public/vtt/${videoID}.vtt`

	let nextTimeCode = 0
	const generateTimeCodes = () => {
		const timeCodeFormat = 'HH:mm:ss.SSS'

		const start = calculateTime(nextTimeCode)
		const end = calculateTime(nextTimeCode + delayBetweenFrames)

		nextTimeCode += delayBetweenFrames

		return { start: start.format(timeCodeFormat), end: end.format(timeCodeFormat) }
	}

	await writeToFile(vtt, 'WEBVTT')
	for (let row = 0, counter = 0; row < tiles.rows; row++) {
		const posY = row * dimension.height
		for (let col = 0; col < tiles.cols; col++) {
			const posX = col * dimension.width

			const { start, end } = generateTimeCodes()

			await writeToFile(vtt, '\n')
			await writeToFile(vtt, `\n${++counter}`)
			await writeToFile(vtt, `\n${start} --> ${end}`)
			await writeToFile(vtt, `\nvtt/thumb#xywh=${posX},${posY},${dimension.width},${dimension.height}`)
		}
	}
}

export const getDividableWidth = (limits: { min: number; max: number }, width: number, increment = 10): number => {
	const min = 10 * 2
	const max = width / 2

	for (let dividend = limits.max; dividend >= limits.min; dividend--) {
		if (width % dividend === 0) return dividend
	}

	// Check if calculation is out-of-bounds
	if (limits.max + increment < max || limits.min - increment > min) {
		if (limits.max + increment < max) {
			limits.max += increment
		}

		if (limits.min - increment > min) {
			limits.min -= increment
		}

		return getDividableWidth(limits, width, increment)
	}
	return -1
}
