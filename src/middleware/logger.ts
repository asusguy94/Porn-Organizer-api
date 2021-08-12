import { Request, Response } from 'express'

export const logger = (message: string) => {
	console.log(message)
}

export default (err: Error, _req: Request, res: Response, _next: any) => {
	res.status(404).send(err.message)

	logger(err.message)
}
