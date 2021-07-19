import mariaDB from '../db'
import { Request, Response } from 'express'

export const success = (res: Response | null, data: any) => {
	if (data && res !== null) res.send(data)
}

export const error = (res: Response | null, err: Error) => {
	console.log(err.message)

	if (res !== null) res.status(404).send(err.message)
}

export const close = (res: Response | null, db: any) => {
	db.end()

	if (res !== null) res.end()
}

type ICallback = (db: any, params: any, body: any) => any
export default (callback: ICallback) => async (req: Request, res: Response) => {
	try {
		var db = await mariaDB()

		success(res, await callback(db, req.params, req.body))
	} catch (err) {
		error(res, err)
	} finally {
		//@ts-ignore
		close(res, db)
	}
}
