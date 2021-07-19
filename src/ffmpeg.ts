//@ts-ignore
import extractFrameAlias from 'ffmpeg-extract-frame'
import sharp from 'sharp'
//@ts-ignore
import getDimensions from 'get-video-dimensions'
import { getVideoDurationInSeconds } from 'get-video-duration'

const getDuration = async (file: any) => Number(await getVideoDurationInSeconds(file))
const getHeight = async (file: any) => (await getDimensions(file)).height

async function resizeImage(src: string, width: number) {
	sharp.cache(false)

	const buffer = await sharp(src).resize(width).toBuffer()
	await sharp(buffer).toFile(src)
}

export const duration = async (file: any) => await getDuration(file)
export const height = async (file: any) => await getHeight(file)

export const extractFrame = async (file: any, dest: string, q = 1, width = 0) => {
	const duration = await getDuration(file)

	await extractFrameAlias({
		input: file,
		output: dest,
		offset: (duration > 100 ? 100 : duration / 2) * 1000,
		quality: q
	})

	if (width) await resizeImage(dest, width)
}
