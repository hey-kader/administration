const fs = require ("node:fs")

const register = fs.readFileSync("html/register.html")
const login    = fs.readFileSync("html/login.html")
const home     = fs.readFileSync("html/index.html")

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
	res.writeHeader('content-type', 'text/html')
	res.end(register)
})

app.post('/register', (res, req) => {
	let buffer = []
	res.onData ((chunk, isLast) => {
		buffer.push(Buffer.from(chunk).toString())
		if (isLast) {
			console.log(buffer)
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
			console.log(buffer)
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
