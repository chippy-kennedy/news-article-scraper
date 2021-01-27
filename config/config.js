require('dotenv').config()

module.exports = {
	"username": process.env.MYSQL_USERNAME,
	"password": process.env.MYSQL_PASSWORD,
	"database": process.env.MYSQL_DATABASE,
	"port": process.env.MYSQL_PORT,
	"host": process.env.MYSQL_HOST,
	"logging": false,
	"dialect": "mysql"
}
