import express from 'express'
const router = express.Router()

import handler from '../../middleware/handler'

router.get(
	'/',
	handler(async () => 'Test Handler')
)

export default router
