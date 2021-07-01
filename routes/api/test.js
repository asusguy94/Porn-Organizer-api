const express = require('express')
const router = express.Router()

const handler = require('../../middleware/handlers')

router.get(
	'/',
	handler(async () => 'Test Handler')
)

module.exports = router
