const pg = require ("pg")
const fs = require ("node:fs")

const pool = new pg.Pool({
	username: "postgres",
	password: "kasd",
	host: "localhost",
	database: "main",
	port: 5432
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
	const sql = "SELECT name FROM users WHERE name = $1"
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


const users = fetch_all_users()
	.then((response) => {
		console.log(response)
	})


module.exports = {
  newUser: newUser,
  allUsers: fetch_all_users,
	checkName: checkName,
	checkEmail: checkEmail,
}
