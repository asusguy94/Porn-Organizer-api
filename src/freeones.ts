import axios from 'axios'
import cheerio from 'cheerio'

const getProfileName = async (db: any, starID: number) => {
	const stars = await db.query('SELECT name FROM stars WHERE id = :starID LIMIT 1', { starID })

	return stars[0] ? stars[0].name : null
}

async function loadUrl(url: string) {
	const queryUrl = await axios.get(url)

	return queryUrl.data
}

const getProfileLink_alias = async (query: string) => {
	const queryData = await loadUrl(`https://www.freeones.com/babes?q=${query}`)

	const $ = cheerio.load(queryData)

	const $section = $('.js-grid')
	const $stars = $section.find('.grid-item > a')

	let link: any = null
	$stars.each((_i, star) => {
		if (link === null) {
			const $star: any = $(star)

			const starName = $star.find('[data-test="subject-name"]').text().trim()
			if (starName.toLowerCase() === query.toLowerCase()) {
				link = `https://www.freeones.com${$star.attr('href').trim()}/bio`.replace(/\/feed\/bio$/, '/bio')
			}
		}
	})

	return link
}

const getProfileData_alias = async (url: string) => {
	const queryData = await loadUrl(url)

	const $ = cheerio.load(queryData)

	const $personalInfo = $('[data-test="section-personal-information"] > div')
	const $appearance = $('.profile-meta-item > .profile-meta-list')
	const $startEnd = $('.timeline-horizontal > div:first-of-type > p')

	const start = $startEnd.first().text().trim().toLowerCase()
	const end = $startEnd.last().text().trim().toLowerCase()

	const $birthdateRef: any = $personalInfo.find('p:first-of-type > a[href*="dateOfBirth"]')

	return {
		name: $('h1.h1').text().trim().split(/ Bio$/)[0],
		birthdate: $birthdateRef.length ? $birthdateRef.attr('href').split('=')[1].trim() : null,
		country: $('[data-test="link-country"]').text().trim(),
		ethnicity: $('[data-test="link_span_ethnicity"]').text().trim(),
		start: start === 'begin' ? '' : start,
		end: end === 'now' ? '' : end,

		appearance: {
			eyecolor: $appearance.find('[data-test="link_eye_color"]').text().trim(),
			haircolor: $appearance.find('[data-test="link_hair_color"]').text().trim(),
			height: $appearance.find('[data-test="link_height"]').text().trim().split(/cm - /)[0],
			weight: $appearance
				.find('[data-test="link_weight"]')
				.text()
				.trim()
				.split(/(kg - )/)[0],
			boobs: $appearance.find('[data-test="p-measurements"] > a:first-of-type').text().trim().split(/\d+/)[1]
		}
	}
}

export const getProfileLink = async (db: any, starID: number) => {
	const starName = await getProfileName(db, starID)
	if (starName) {
		return await getProfileLink_alias(starName)
	}

	return null
}

export const getProfileData = async (profileUrl: string) => {
	return await getProfileData_alias(profileUrl)
}

export const setProfileData = async (db: any, starID: number, prop: string, value: string) => {
	await db.query(`UPDATE stars SET ${prop} = :value WHERE id = :starID`, { value, starID })
}
