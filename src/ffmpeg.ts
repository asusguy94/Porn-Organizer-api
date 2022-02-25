//@ts-ignore
import extractFrameAlias from 'ffmpeg-extract-frame'
import sharp from 'sharp'
//@ts-ignore
import getDimensions from 'get-video-dimensions'
import { getVideoDurationInSeconds } from 'get-video-duration'
// @ts-ignore
import generatePreview from 'ffmpeg-generate-video-preview'

import { generateVTTData, getDividableWidth } from './helper'

import { getSetting } from './settings'

const getDuration = async (file: any) => Number(await getVideoDurationInSeconds(file))
const getHeight = async (file: any) => (await getDimensions(file)).height
const getWidth = async (file: any) => (await getDimensions(file)).width

async function resizeImage(src: string, width: number) {
	sharp.cache(false)

	const buffer = await sharp(src).resize(width).toBuffer()
	await sharp(buffer).toFile(src)
}

export const duration = async (file: any) => await getDuration(file)
export const height = async (file: any) => await getHeight(file)

export const extractFrame = async (file: any, dest: string, q = 1, width = 0) => {
	const time = await getSetting('thumbnail_start')
	const duration = await getDuration(file)

	await extractFrameAlias({
		input: file,
		output: dest,
		offset: (duration > time ? time : duration / 2) * 1000,
		quality: q
	})

	if (width) await resizeImage(dest, width)
}

const calculateDelay = (duration: number) => {
	if (duration > 60 * 60) {
		return 10
	} else if (duration > 20 * 60) {
		//20m-60m
		return 5
	} else if (duration > 5 * 60) {
		//5m-20m
		return 2
	} else {
		//0-5m
		return 1
	}
}

export const extractVtt = async (src: string, dest: string, videoID: number) => {
	const duration = await getDuration(src) // in seconds
	const delayBetweenFrames = calculateDelay(duration) // in seconds (new frame every THIS seconds)

	const cols = 8 // images per row
	const rows = Math.floor(Math.floor(duration / delayBetweenFrames) / cols)

	/* Generate Preview */
	console.log(`Creating a preview with ${cols * rows} frames`)
	const {
		width: calcWidth,
		height: calcHeight,
		rows: numRows,
		cols: numCols
	} = await generatePreview({
		input: src,
		output: dest,
		width: getDividableWidth({ min: 80, max: 160 }, await getWidth(src)),
		quality: 6,
		rows: rows,
		cols: cols
	})

	/* Generate VTT output */
	await generateVTTData(
		videoID,
		delayBetweenFrames,
		{ rows: numRows, cols: numCols },
		{
			width: calcWidth,
			height: calcHeight
		}
	)
}
