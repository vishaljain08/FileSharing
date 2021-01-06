import fs from 'fs'

import path from 'path'

import Router from 'koa-router'

const router = new Router({ prefix: '/secure' })

import Files from '../modules/files.js'
const dbName = 'website.db'

async function checkAuth(ctx, next) {
	console.log('secure router middleware')
	console.log(ctx.hbs)
	if(ctx.hbs.authorised !== true) return ctx.redirect('/login?msg=you need to log in&referrer=/secure')
	await next()
}

router.use(checkAuth)

router.get('/', async ctx => {
	const files = await new Files(dbName)
	try {
		const records = await files.all(ctx.session.userid)
		console.log(records)
		ctx.hbs.records = records
		console.log(ctx.hbs)
		await ctx.render('secure', ctx.hbs)
	} catch(err) {
		ctx.hbs.error = err.message
		await ctx.render('error', ctx.hbs)
	}
})

// utilizing the koa-router url parameter functionality from documentation to get the id value through url
router.get('/details/:id', async(ctx,next) => {
	const files = await new Files(dbName)
	try {
		const details = await files.details(ctx.params.id) // calling in the details function in file.js module
		console.log(details)
		ctx.hbs.file = details

		if (ctx.hbs.file[0].userid === ctx.session.userid) {

			await ctx.render('details', ctx.hbs) // allow to access the details of file only to the owner of the file

		} else {
			return ctx.redirect('/?msg=you can only view your files') // redirect if not the owner
		}
	} catch (err) {
		ctx.hbs.error = err.message
		await ctx.render('error', ctx.hbs)
	}
})

router.get('/upload', async ctx => {
	await ctx.render('upload', ctx.hbs)
})

router.post('/upload', async ctx => {
	const files = await new Files(dbName)
	try {
		ctx.request.body.account = ctx.session.userid
		if(ctx.request.files.file.name) {
			ctx.request.body.filePath = ctx.request.files.file.path
			ctx.request.body.fileName = ctx.request.files.file.name
			ctx.request.body.fileType = ctx.request.files.file.type
		}
		await files.add(ctx.request.body)
		return ctx.redirect('/secure?msg=new file uploaded')
	} catch(err) {
		console.log(err)
		await ctx.render('error', ctx.hbs)
	} finally {
		files.close()
	}
})

router.post('/download', async ctx => {
	try {
		const filename = ctx.request.body.fileName
		if (ctx.request.body.userId === ctx.session.userid) {
			const file = `files/${filename}`

			const name = path.basename(file)

			ctx.body = fs.createReadStream(file)

			ctx.attachment(file)
		} else {
			return ctx.redirect('/?msg=you can only download your files')
		}

	} catch (err) {
		console.log(err)
		await ctx.render('error', ctx.hbs)
	}
})

export default router
