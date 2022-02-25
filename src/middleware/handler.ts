import { FastifyRequest, FastifyReply } from 'fastify'
import mariaDB from '../db'

import { logger } from './logger'

export const success = (reply: FastifyReply, data: any) => {
	if (data && reply !== null) reply.send(data)
}

export const error = (reply: FastifyReply | null, err: any, code = 404) => {
	logger(err.message)

	if (reply !== null) reply.status(code).send(err.message)
}

export const close = (reply: FastifyReply | null, db: any) => {
	if (db !== null) db.end()

	if (reply !== null) reply.send()
}

type ICallback = (db: any, params: any, body: any, request: FastifyRequest, reply: FastifyReply) => any
const withCallback = (callback: ICallback) => async (request: FastifyRequest, reply: FastifyReply) => {
	var db = null
	try {
		db = await mariaDB()

		success(reply, await callback(db, request.params, request.body, request, reply))
	} catch (err) {
		error(reply, err)
	} finally {
		close(reply, db)
	}
}

export default withCallback
