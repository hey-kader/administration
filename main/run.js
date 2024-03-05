const fs = require ("node:fs")

const register = fs.readFileSync("html/register.html")
const login    = fs.readFileSync("html/login.html")
const home     = fs.readFileSync("html/index.html")
const base     = fs.readFileSync("html/base.html")

const db = require ("./db/db.js")

const uws = require ("./bin/uws_darwin_arm64_115")
const App =  uws.SSLApp

let live_connections = new Set()

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
		//console.log(buffer)
		if (last) {
			 buffer = buffer.join('')
			 console.log(buffer)
			 //const parse = JSON.parse(buffer)
			 //db.newPost(parse.name, parse.text, parse.color)
		}
	})
  res.onAborted(() => {
		console.log ("post /base aborted.")
	})
})


app.get('/base/stat', (res, req) => {
	res.cork(() => {
		res.writeHeader("content-type", "application/json")
		db.allUsers()
			.then((users) => {
				res.end(JSON.stringify({users: users}))
			})
		res.onAborted(() => {
			console.log('abort')
		})
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

app.ws('/latest', {
	comression: uws.SHARED_COMPRESSOR,
	maxPayloadLength: 16*1024,
	idleTimeout: 10,
	open: (ws) => {
		console.log('open syncronization socket!')
		live_connections.add(ws)
	},
	message: (ws, msg, isBinary) => {
		let m = JSON.parse(Buffer.from(msg).toString())
		console.log(m)
		if (m.action === "like") {
			console.log('post like')
			let res = db.likePost(m.user_id, m.post_id)
			console.log('res', res)
			live_connections.forEach((socket) => {
				socket.send(JSON.stringify(m))
			})
		}
		else if (m.action === "post") {
			console.log('make post here', m)
			let res = db.newPost(m.name, m.text, m.color)
				.then((r) => {
					console.log('here',r.rows[0].post_id)
					m.post_id = r.rows[0].post_id
					//
					//develop
					ws.cork(() => {
						live_connections.forEach((socket) => {
							socket.send(JSON.stringify(m))
						})
					})
				})
		}
		else if (m.action === "comment") {
			console.log('comment',m)
			db.newComment(m.user_id, m.post_id, m.comment)
		}
		else {
			live_connections.forEach((socket) => {
				socket.send(msg, isBinary)
			})
		}
	},
	close: (ws) => {
		console.log('socket closed')
		live_connections.delete(ws)
		live_connections.forEach((connection) => {
			console.log(connection)
		})
	}
})

app.get('/', (res, req) => {
	res.end(home)
})

app.get('/comments/*', (res, req) => {
	res.cork( () => {
		let url = req.getUrl()
		let parse = url.split('/')
		let route = parse[2]
		console.log(route, parse)
		res.writeHeader("content-type", "application/json")
		console.log("cork")
		db.getComments(route)
			.then((r) => {
				console.log(url, route, r.rows)
				if (r.rows.length > 0) {
					res.end(JSON.stringify(r.rows))
				}
				else {
					res.end(JSON.stringify([]))
				}
			})
	})
	res.onAborted(() => {
		console.log('aborted handler comments get')
	})
})

app.listen (443, (listen) => {
	if (listen) {
		console.log('listening')
	}
	else {
		console.log('failed to listen')
	}
})
