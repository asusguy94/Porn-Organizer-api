export const getWebsiteID = async (db: any, website: string) => {
	const websites = await db.query('SELECT id FROM websites WHERE name = :website LIMIT 1', { website })

	return websites[0] ? websites[0].id : null
}

export const getSiteID = async (db: any, site: string) => {
	const sites = await db.query('SELECT id FROM sites WHERE name = :site LIMIT 1', { site })

	return sites[0] ? sites[0].id : null
}

export const getStarID = async (db: any, star: string) => {
	const stars = await db.query('SELECT id FROM stars WHERE name = :star LIMIT 1', { star })

	return stars[0] ? stars[0].id : null
}

export const getAliasAsStarID = async (db: any, alias: string) => {
	const stars = await db.query(
		'SELECT stars.id FROM stars JOIN staralias ON staralias.starID = stars.id WHERE staralias.name = :alias GROUP BY staralias.id',
		{ alias }
	)

	return stars[0] ? stars[0].id : null
}

export const getIgnoredStar = async (db: any, star: string) => {
	const stars = await db.query('SELECT id FROM stars WHERE name = :star AND autoTaggerIgnore = TRUE LIMIT 1', {
		star
	})

	return stars[0] ? stars[0].id : null
}

export const getIgnoredStarID = async (db: any, starID: number) => {
	const stars = await db.query('SELECT id FROM stars WHERE id = :starID AND autoTaggerIgnore = TRUE LIMIT 1', {
		starID
	})

	return stars[0] ? stars[0].id : null
}
