import Joi from 'joi'

const schema = (schema: Joi.Schema, body: any) => {
	const { error, value } = schema.validate(body)
	if (error) throw new Error(error.details[0].message)

	return value
}

export default schema
