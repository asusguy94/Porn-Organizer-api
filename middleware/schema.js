module.exports = (schema, body) => {
	const { error, value } = schema.validate(body)
	if (error) throw new Error(error.details[0].message)

	return value
}
// TODO needs body to be passed, perhaps there is a better solution
//>>could pass this method from handler()-method
