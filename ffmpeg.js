const extractFrame = require('ffmpeg-extract-frame')
const sharp = require('sharp')
const getDimensions = require('get-video-dimensions')
const { getVideoDurationInSeconds } = require('get-video-duration')

const getDuration = async file => parseInt(await getVideoDurationInSeconds(file))
const getHeight = async file => (await getDimensions(file)).height

async function resizeImage(src, width) {
	sharp.cache(false)

	const buffer = await sharp(src).resize(width).toBuffer()
	await sharp(buffer).toFile(src)
}

module.exports = {
	duration: async file => await getDuration(file),
	height: async file => await getHeight(file),
	extractFrame: async (file, dest, q = 1, width = 0) => {
		const duration = await getDuration(file)

		await extractFrame({
			input: file,
			output: dest,
			offset: (duration > 100 ? 100 : duration / 2) * 1000,
			quality: q
		})

		if (width) await resizeImage(dest, width)
	}
}
