module.exports = {
	getWebsiteID: async (db, website) => {
		const websites = await db.query('SELECT id FROM websites WHERE name = :website LIMIT 1', { website })

		return websites[0] ? websites[0].id : null
	},
	getSiteID: async (db, site) => {
		const sites = await db.query('SELECT id FROM sites WHERE name = :site LIMIT 1', { site })

		return sites[0] ? sites[0].id : null
	},
	getStarID: async (db, star) => {
		const stars = await db.query('SELECT id FROM stars WHERE name = :star LIMIT 1', { star })

		return stars[0] ? stars[0].id : null
	},
	getAliasAsStarID: async (db, alias) => {
		const stars = await db.query(
			'SELECT stars.id FROM stars JOIN staralias ON staralias.starID = stars.id WHERE staralias.name = :alias GROUP BY staralias.id',
			{ alias }
		)

		return stars[0] ? stars[0].id : null
	},
	getIgnoredStar: async (db, star) => {
		const stars = await db.query('SELECT id FROM stars WHERE name = :star AND autoTaggerIgnore = TRUE LIMIT 1', {
			star
		})

		return stars[0] ? stars[0].id : null
	},
	getIgnoredStarID: async (db, starID) => {
		const stars = await db.query('SELECT id FROM stars WHERE id = :starID AND autoTaggerIgnore = TRUE LIMIT 1', {
			starID
		})

		return stars[0] ? stars[0].id : null
	}
}
