import express, { Express } from 'express'
import cors from 'cors'

// API Routes
import home from './routes/api/home'
import video from './routes/api/video'
import star from './routes/api/star'
import category from './routes/api/category'
import attribute from './routes/api/attribute'
import location from './routes/api/location'
import bookmark from './routes/api/bookmark'
import search from './routes/api/search'
import website from './routes/api/website'
import country from './routes/api/country'

// FileSystem Routes
import fs_star from './routes/server/star'
import fs_video from './routes/server/video'
import fs_generate from './routes/server/generate'

// Testing Route
import test from './routes/api/test'

export default (app: Express) => {
	// Middleware
	app.use(express.json())
	app.use(cors())
	app.use(express.static('public'))

	// API Path
	app.use('/api/home', home)
	app.use('/api/video', video)
	app.use('/api/star', star)
	app.use('/api/category', category)
	app.use('/api/attribute', attribute)
	app.use('/api/location', location)
	app.use('/api/bookmark', bookmark)
	app.use('/api/search', search)
	app.use('/api/website', website)
	app.use('/api/country', country)

	// FileSystem Path
	app.use('/star', fs_star)
	app.use('/video', fs_video)
	app.use('/generate', fs_generate)

	// Testing Path
	app.use('/test', test)
}
