require ("dotenv").config()
const pg = require ("pg")
const fs = require ("node:fs")

const pool = new pg.Pool({
	username: process.env.pg_username,
	password: process.env.pg_password,
	host: process.env.pg_host,
	port: process.env.pg_port,
	database: process.env.pg_database
})

if (!fs.existsSync('./db/sql.log')) {
	const users_table_init = `CREATE TABLE users (
		id SERIAL PRIMARY KEY,
		name VARCHAR(255) NOT NULL,
		digest VARCHAR(64) NOT NULL UNIQUE,
		email VARCHAR(255) NOT NULL UNIQUE,
		created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);`

	pool.query(users_table_init)
			.then((e) => {
				console.log(e)
				fs.writeFileSync("./db/sql.log", users_table_init)			
			})
}
else {
	console.log('table users existential check ok ...')
}

if (!fs.existsSync('./db/posts.sql.log')) {
	const posts_table_init = `CREATE TABLE posts (
		name VARCHAR(255) NOT NULL,
		text VARCHAR(2048) NOT NULL,
		created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);`
	pool.query(posts_table_init)
		.then((e) => {
			console.log(e)
			fs.writeFileSync('./db/posts.sql.log', 'OK')
		})
}
else {
	console.log('posts table has already been created')
}

// patch 1 to posts, allow a color field, type varchar(8)
if (!fs.existsSync('./db/1.posts.sql.log')) {
	const query = `ALTER TABLE posts
	ADD COLUMN color VARCHAR(8);`
	pool.query(query)
		.then((e) => {
			console.log('alteres posts table to add color ok...')
			console.log(e)
			fs.writeFileSync('./db/1.posts.sql.log', 'OK')
		})
}
else {
	console.log('posts table alter already applied to add optional color column')
}

if (!fs.existsSync('./db/2.posts.sql.log')) {
	const query = `ALTER TABLE posts
	ADD COLUMN post_id SERIAL PRIMARY KEY`
	pool.query(query)
		.then((e) => {
			console.log('alter posts add id applied ...')
			console.log(e)
			fs.writeFileSync('./db/2.posts.sql.log', 'OK')
		})
}
else {
	console.log('second patch already applied, which adds a unique id each post')
}


function newPost(name, text, color) {
	const sql = `INSERT INTO posts(name, text, color) VALUES($1, $2, $3);`
	try {
		pool.query(sql, [name, text, color])
			.then((res) => {
				console.log('new post insertion ok', res)
			})
	}
	catch (error) {
		console.error('caught error making a new post, e: ', error)
	}
}

async function fetch_all_posts () {
	const sql = `SELECT name, text, color, post_id, created_at FROM posts ORDER BY created_at DESC;`
	const res = await pool.query(sql)
	console.log(res)
	return res
}


function newUser (name, email, digest) {
	const sql = `INSERT INTO users(name, digest, email) VALUES($1, $2, $3) RETURNING *`
	const values = [name, digest, email]
	try {
		pool.query(sql, values)
			.then((res) => {
				console.log('insertion success on table users!')
				console.log(res)
			})
	}
	catch (error) {
		console.error('new user error e1', error)
	}
}

async function fetch_all_users () {
	try {
		const sql = `SELECT id, name, email FROM users;`
		const res = await pool.query(sql)
		return res.rows
	}
	catch (error) {
		console.log('fetch all users error, e2', error)
	}
}

async function checkName (name) {
	const sql = "SELECT name,digest FROM users WHERE name = $1"
	try {
		const result = await pool.query(sql, [name])
		if (result.rows[0]) {
			return true
		}
		else {
			return false
		}
	}
	catch (error) {
		console.error('check name error caught, er', error)
	}
}

async function checkEmail (email) {
	const sql = "SELECT email FROM users WHERE email = $1"
	try {
		const result = await pool.query(sql, [email])
		if (result.rows[0]) {
			return true
		}
		else {
		return false
		}
	}
	catch (error) {
		console.error('error checkEmail', error)
	}
}

async function getDigest (name) {
	const sql = "SELECT digest FROM users WHERE name = $1"
	try {
		const result = await pool.query(sql, [name])
		console.log(result.rows[0])
		return result.rows[0]
	}
	catch (error) {
		console.error("failed to get digest from name. e", error)
	}
}

module.exports = {
  newUser: newUser,
  allUsers: fetch_all_users,
	checkName: checkName,
	checkEmail: checkEmail,
	getDigest: getDigest,
	newPost: newPost,
	allPosts: fetch_all_posts
}
