const { dirOnly } = require('./helper')

const starRegex = []
const dateRegex = []
const titleRegex = []
const siteRegex = []

starRegex[0] = /^{\d{4}-\d{2}-\d{2}} \[.*\] /
starRegex[1] = /_.*$/

dateRegex[0] = /^{/
dateRegex[1] = /}/

siteRegex[0] = /^{\d{4}-\d{2}-\d{2}} \[/
siteRegex[1] = /\]/

titleRegex[0] = /^{\d{4}-\d{2}-\d{2}} \[.*\] .*_/

module.exports = {
	generateTitle: path => {
		const file = dirOnly(path)

		return file.split(titleRegex[0])[1]
	},
	generateStarName: path => {
		const file = dirOnly(path)

		return file.split(starRegex[0])[1].split(starRegex[1])[0]
	},
	generateDate: path => {
		const file = dirOnly(path)

		return file.split(dateRegex[0])[1].split(dateRegex[1])[0]
	},
	generateSite: path => {
		const file = dirOnly(path)

		return file.split(siteRegex[0])[1].split(siteRegex[1])[0]
	},
	generateWebsite: path => dirOnly(path, true)
}
