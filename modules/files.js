
/** @module Files */

import sqlite from 'sqlite-async'
import mime from 'mime-types'
import fs from 'fs-extra'

/**
 * Accounts
 * ES6 module that handles registering accounts and logging in.
 */
class Files {
	/**
   * Create a file object
   * @param {String} [dbName=":memory:"] - The name of the database file to use.
   */
	constructor(dbName = ':memory:') {
		return (async() => {
			this.db = await sqlite.open(dbName)
			// we need this table to store the user accounts
			const sql = 'CREATE TABLE IF NOT EXISTS files (\
									id INTEGER PRIMARY KEY AUTOINCREMENT,\
									userid INTEGER,\
									name TEXT NOT NULL,\
									type TEXT,\
									description TEXT,\
									file TEXT NOT NULL,\
									FOREIGN KEY(userid) REFERENCES users(id));'
			await this.db.run(sql)
			return this
		})()
	}

	/**
	 * searches the databse for the files a user has uploaded and returns it
	 * @param {Integer} the userid of the logged in user
	 * @returns {Object} returns all the files a user has uploaded
	 */
	async all(userid) {
		const sql = `SELECT * FROM files WHERE files.userid = ${userid};`
		const files = await this.db.all(sql)
		console.log(typeof files)
		return files
	}

	/**
	 * add a file to the database
	 * @param {Object} the data of the file to be added to the database
	 * @returns {Boolean} returns true if data is succesfully added
	 */
	async add(data) {
		console.log(data)
		let filename
		if (data.fileName) {
			filename = `${Date.now()}.${mime.extension(data.fileType)}`
			console.log(filename)
			await fs.copy(data.filePath, `files/${filename}`)
		}
		try {
			const sql = `INSERT INTO files (userid, name, type, description, file) VALUES (${data.account},\
									"${data.Name}", "${mime.extension(data.fileType)}",\
									"${data.Description}", "${filename}")`
			console.log(sql)
			await this.db.run(sql)
			return true
		} catch(err) {
			console.log(err)
			throw err
		}
	}

	/**
	 * get the details of a file from the database
	 * @param {Integer} id of the file
	 * @returns {Object} returns the details of the file
	 */
	async details(id) {
		console.log('got here')
		const sql = `SELECT * FROM files WHERE files.id = ${id};`
		console.log(sql)
		const details = await this.db.all(sql)
		console.log(typeof details)
		return details
	}

	async close() {
		await this.db.close()
	}

}


export default Files
