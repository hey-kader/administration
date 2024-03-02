const fs = require ("node:fs")

const register = fs.readFileSync("html/register.html")
const login    = fs.readFileSync("html/login.html")
const home     = fs.readFileSync("html/index.html")
const base     = fs.readFileSync("html/base.html")

const db = require ("./db/db.js")

const App = require("./bin/uws_darwin_arm64_115").SSLApp

const app = App ({
	cert_file_name: "./.ssl/localhost.pem",
	key_file_name: "./.ssl/localhost.pem.key"
})

app.any('/*', (res, req) => {
	res.writeHeader('content-type', 'text/html')
	res.end('<h1>hey! out of bounds, bones.</h1>')
})

app.get('/register', (res, req) => {
	res.writeHeader('content-type', 'text/html')
	res.end(register)
})

app.get('/latest', (res, req) => {
	const posts = db.allPosts()	
		.then((p) => {
			console.log("POSTS")
			res.writeHeader('content-type', 'application/json')
			res.end(JSON.stringify({posts: p.rows}))
		})
		res.onAborted(() => {
			console.log("get / latest abort")
		})
})

app.get('/auth/*', (res, req) => {
	let name = req.getUrl().split('/')[2]
	console.log(name)
	db.getDigest(name)
		.then((result) => {
			console.log('digest',result)
			res.end(JSON.stringify(result))
		})
	res.onAborted(()=> {
		console.log('abort /auth/:name')
	})
})

app.get('/base', (res, req) => {
	res.writeHeader('content-type', 'text/html')
	res.end(base)
})

app.post('/base', (res, req) => {
	console.log("share")
	let buffer = []
	res.onData((chunk, last) => {
		buffer.push(Buffer.from(chunk).toString())	
		console.log(buffer)
		if (last) {
			 const j = JSON.parse(buffer.join(''))
			 db.newPost(j.name, j.text)
			 res.end(JSON.stringify(j))
		}
	})
	res.onAborted (() => {
		console.log('signal abort')
	})
})


app.get('/base/stat', (res, req) => {
	res.writeHeader("content-type", "application/json")
	db.allUsers()
		.then((users) => {
			res.end(JSON.stringify({users: users}))
		})
	res.onAborted(() => {
		console.log('abort')
	})
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
								if (result === false && r === false) {
									console.log('safe to enter in db')
									db.newUser(j.name, j.email, j.digest)
									res.end(JSON.stringify(j))
								}
							})
					}
			})
		}
	})
	res.onAborted(() => {
		console.log('abort post to /register (thats all we know)')
	})
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
	res.onAborted(() => {
		console.log('aborted post to /login')
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
