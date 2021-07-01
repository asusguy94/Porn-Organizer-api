const fs = require('fs')
const path = require('path')
const fetch = require('node-fetch')
const dayjs = require('dayjs')

const { getSetting } = require('./settings')

function getClosest(search, arr) {
	return arr.reduce((a, b) => {
		let aDiff = Math.abs(a - search)
		let bDiff = Math.abs(b - search)

		if (aDiff === bDiff) {
			return a > b ? a : b
		} else {
			return bDiff < aDiff ? b : a
		}
	})
}

module.exports = {
	downloader: async (url, path, callback = () => {}) => {
		const response = await fetch(url)
		const buffer = await response.buffer()
		await fs.promises.writeFile(`./${path}`, buffer)
	},
	dirOnly: (dir, root = false) => {
		return root ? path.parse(dir).dir : path.parse(dir).name
	},
	noExt: dir => {
		const parsed = path.parse(dir)

		return parsed.dir ? `${parsed.dir}/${parsed.name}` : parsed.name
	},
	removeThumbnails: async videoID => {
		// Remove Images
		fs.unlink(`./public/images/videos/${videoID}.jpg`, () => {})
		fs.unlink(`./public/images/videos/${videoID}-${await getSetting('thumbnail_res')}.jpg`, () => {})

		// Remove Previews
		fs.unlink(`./public/images/thumbnails/${videoID}.jpg`, () => {})
		fs.unlink(`./public/vtt/${videoID}.vtt`, () => {})
	},
	getClosestQ: quality => {
		if (quality === 396) {
			return 480
		}

		return getClosest(quality, [1080, 720, 480, 360])
	},
	fileExists: async path =>
		new Promise(resolve => {
			fs.access(`./public/${path}`, fs.constants.F_OK, err => {
				if (!err) {
					resolve(true)
					return
				}

				resolve(false)
			})
		}),
	formatDate: (date, raw = false) => {
		date = dayjs(date)

		return raw ? date.format('YYYY-MM-DD') : date.format('D MMMM YYYY')
	},
	formatBreastSize: input => {
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
	},

	getCountryCode: async (db, label) => {
		try {
			const result = await db.query('SELECT code FROM country WHERE name = :country LIMIT 1', { country: label })

			return result[0] ? result[0].code : null
		} catch (err) {
			console.log(err.message)

			return null
		}
	},
	getSimilarStars: async (db, starID, maxLength = 9, maxMaxLength = 18) => {
		try {
			const stars = await db.query('SELECT * FROM stars WHERE id = :starID LIMIT 1', { starID })
			const currentStar = stars[0]

			const match_default = 2
			const match_important = 5
			const decimals = 0

			const otherStars = await db.query('SELECT * FROM stars WHERE NOT id = :starID', { starID })
			const otherStarsArr = otherStars.filter(otherStar => {
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
				if (currentStar['height'] && otherStar['height'] !== currentStar['height'])
					otherStar.match -= match_default
				if (currentStar['weight'] && otherStar['weight'] !== currentStar['weight'])
					otherStar.match -= match_default
				if (currentStar['start'] && otherStar['start'] !== currentStar['start'])
					otherStar.match -= match_default
				if (currentStar['end'] && otherStar['end'] !== currentStar['end']) otherStar.match -= match_default
				if (currentStar['birthdate'] && otherStar['birthdate']) {
					const now = dayjs()

					const self = dayjs(currentStar['birthdate'])
					const other = dayjs(otherStar['birthdate'])

					var diff_self = now.diff(self, 'years', true).toFixed(decimals)
					var diff_other = now.diff(other, 'years', true).toFixed(decimals)

					if (diff_self !== diff_other) otherStar.match -= match_important
				}

				return otherStar.match > 0 ? otherStar : null
			})

			otherStarsArr.sort((b, a) => Math.sign(a.match - b.match))
			return otherStarsArr.slice(0, maxLength)

			// TODO check if match is 100%
			// if so...more elements should be allowed
			// but not more than maxMaxLength
		} catch (err) {
			console.log(err.message)
		}
	},
	isNewDate: (dateStr1, dateStr2) => {
		const date1 = dayjs(dateStr1)
		const date2 = dayjs(dateStr2)

		return date1.diff(date2) !== 0
	},
	getResizedThumb: async id => `${id}-${await getSetting('thumbnail_res')}.jpg`
}
