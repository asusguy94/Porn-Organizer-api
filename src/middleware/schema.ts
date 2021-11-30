import { FastifyRequest } from 'fastify'
import Joi from 'joi'

const schema = (schema: Joi.Schema, body: FastifyRequest['body']) => {
	const { error, value } = schema.validate(body !== null ? body : {})
	if (error) throw new Error(error.details[0].message)

	return value
}

export default schema
