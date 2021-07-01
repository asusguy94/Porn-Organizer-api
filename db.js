const mariaDB = require('mariadb')

const config = require('./config.json')

module.exports = {
	db: (params = true) =>
		mariaDB.createConnection({
			host: config.db.host,
			user: config.db.user,
			password: config.db.password,
			database: config.db.database,
			namedPlaceholders: params
		}),
	sql: (orderBy, limit = -1) =>
		`SELECT videos.id, videos.name, COALESCE(starAge * 365, DATEDIFF(videos.date, stars.birthdate)) AS ageInVideo FROM videos LEFT JOIN bookmarks ON bookmarks.videoID = videos.id LEFT JOIN videostars ON videos.id = videostars.videoID LEFT JOIN stars ON videostars.starID = stars.id GROUP BY videos.id HAVING COUNT(bookmarks.id) < 1 OR videos.id = :id ORDER BY ${orderBy} ${
			limit !== -1 ? `LIMIT ${limit}` : ''
		}`,
	VIDEO_ORDER_ASC: true // false=MILF,true=TEEN
}
