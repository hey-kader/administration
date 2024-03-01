const fs = require ("node:fs")

const register = fs.readFileSync("html/register.html")
const login    = fs.readFileSync("html/login.html")
const home     = fs.readFileSync("html/index.html")

const db = require ("./db/db.js")
//console.log(db)

const App = require("./bin/uws_darwin_arm64_115").SSLApp

const app = App ({
	cert_file_name: "./.ssl/localhost.pem",
	key_file_name: "./.ssl/localhost.pem.key"
})

app.any('/*', (res, req) => {
	res.writeHeader('content-type', 'text/html')
	res.end('<h1>hi</h1>')
})

app.get('/register', (res, req) => {
	const users = db.allUsers()
		.then((result) => {
			console.log(result)
		})
	res.writeHeader('content-type', 'text/html')
	res.end(register)
})

function db_check_email (email) {
	db.checkEmail(email)
		.then((result) => {
			return result
		})
}

function db_check_name (name) {
	db.checkName(name)
		.then((result) => {
			return result
		})
}

app.get('/api/*', (res, req) => {
	let name = req.getUrl().split('/')[2]
	console.log(name)
	db.checkName(name)
		.then((check) => {
			console.log(check)
			res.end(JSON.stringify({name: check}))
		})
	res.onAborted( () => {
		console.log('aborted')
	})
})

app.get('/register/*', (res, req) => {
	let email = req.getUrl().split('/')[2]
	db.checkEmail(email)
		.then((check) => {
			console.log(check)
			res.end(JSON.stringify({email: check}))
		})
	res.onAborted (() => {
		console.log('aborted')
	})
})

app.post('/register', (res, req) => {
	let buffer = []
	res.onData ((chunk, isLast) => {
		buffer.push(Buffer.from(chunk).toString())
		if (isLast) {
			const j = JSON.parse(buffer.join(''))
			console.log(j)
			db.checkEmail(j.email)
				.then((result) => {
					if (result === false) {
						db.checkName(j.name)
							.then((r) => {
								if (r === false) {
									console.log('safe to enter in db')
									db.newUser(j.name, j.email, j.digest)
								}
							})
					}
				})
			//db.newUser(j.name, j.email, j.digest)

		}
	})
	res.writeStatus('302 Found')
	res.writeHeader('Location', '/')
	res.end()
})

app.get('/login', (res, req) => {
	res.end(login)
})

app.post('/login', (res, req) => {
	let buffer = []
	res.onData((chunk, isLast) => {
		buffer.push(Buffer.from(chunk).toString())
		if (isLast) {
			console.log(buffer.join('').split('&'))
			// digest password and use db.newUser(name, digest, email)
			let [name, password] = buffer.join('').split('&')
			name = name.split('=')[1]
			password = password.split('=')[1]
			console.log(name, password)
			
		}
	})
	console.log('login posted')	
	res.writeStatus('302 Found')
	res.writeHeader('Location', '/')
	res.end()
})

app.get('/', (res, req) => {
	res.end(home)
})

app.listen (443, (listen) => {
	if (listen) {
		console.log('listening')
	}
	else {
		console.log('failed to listen')
	}
})
