const express = require('express')
const cors = require('cors')

// API Routes
const home = require('../routes/api/home')
const video = require('../routes/api/video')
const star = require('../routes/api/star')
const category = require('../routes/api/category')
const attribute = require('../routes/api/attribute')
const location = require('../routes/api/location')
const bookmark = require('../routes/api/bookmark')
const search = require('../routes/api/search')
const website = require('../routes/api/website')
const country = require('../routes/api/country')

// FileSystem Routes
const fs_star = require('../routes/server/star')
const fs_video = require('../routes/server/video')
const fs_generate = require('../routes/server/generate')

// Testing Route
const test = require('../routes/api/test')

module.exports = function (app) {
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
