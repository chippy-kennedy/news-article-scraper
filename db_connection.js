require('dotenv').config()

const Sequelize = require('sequelize')
const sequelize = new Sequelize(process.env.MYSQL_DATABASE, process.env.MYSQL_USERNAME, process.env.MYSQL_PASSWORD, {
  host: process.env.MYSQL_HOST,
  port: process.env.MYSQL_PORT,
  dialect: 'mysql',
  operatorsAliases: false,
  //logging: (config.environment === 'development' ? console.log : false),
	logging: false,
  pool: {
    max: 5,
    min: 0,
    idle: 2000,
    acquire: 2000
  },
  define: {
    timestamps: false
  },
})

sequelize
  .authenticate()
  .then(() => {
    console.log('Database connection has been established successfully.')
  })
  .catch(error => {
    console.error('Unable to connect to the database:', error)
  })

module.exports = sequelize
