import mariaDB from 'mariadb'

import { db as dbConfig } from './config'

const connect = (params = true) => {
	return mariaDB.createConnection({
		host: dbConfig.host,
		user: dbConfig.user,
		password: dbConfig.password,
		database: dbConfig.database,
		namedPlaceholders: params
	})
}

export const sql = (orderBy: string, limit = -1) => {
	return `SELECT videos.id, videos.name, COALESCE(starAge * 365, DATEDIFF(videos.date, stars.birthdate)) AS ageInVideo FROM videos LEFT JOIN bookmarks ON bookmarks.videoID = videos.id LEFT JOIN videostars ON videos.id = videostars.videoID LEFT JOIN stars ON videostars.starID = stars.id GROUP BY videos.id HAVING COUNT(bookmarks.id) < 1 OR videos.id = :id ORDER BY ${orderBy} ${
		limit !== -1 ? `LIMIT ${limit}` : ''
	}`
}

export const VIDEO_ORDER_ASC = true

export default connect
