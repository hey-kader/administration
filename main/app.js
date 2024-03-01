const fs = require ("node:fs")

const register = fs.readFileSync("html/register.html")
const login    = fs.readFileSync("html/login.html")

let home = `
<!DOCTYPE html>
<html>
	<head>
		<title>home</title>
	</head>
	<body>
		<nav>
			<a href="/login">login</a>
			<a href="/register">register</a>
		<nav>
	</body>
</html>
`

const App = require("./node/uws_darwin_arm64_115").SSLApp
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
