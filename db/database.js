require("dotenv").config()
module.exports = {
  development: {
    username: process.env.db_user,
    password: process.env.db_password,
    database: process.env.db_name,
    host: process.env.host,
    dialect: "postgres",
  },
  "production": {
    "username": process.env.db_user,
    "password": process.env.db_password,
    "database": process.env.db_name,
    "host": process.env.host,
    "dialect": "postgres",
    dialectOptions: {
      ssl: {rejectUnauthorized: false},
    },
  }
}
