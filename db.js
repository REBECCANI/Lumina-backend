const mysql = require('mysql2');
require('dotenv').config();
console.log("DB_HOST:", process.env.DB_HOST);  // Add this to debug
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PASSWORD:", process.env.DB_PASSWORD);
console.log("DB_NAME:", process.env.DB_NAME);
console.log("DB_PORT:", process.env.DB_PORT);

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    connectionLimit: 10 // Set to the maximum number of connections you want to allow
});

pool.getConnection((err, connection) => {
    if (err) {
        console.error('Error connecting to the database!', err);
        process.exit(1);
    }
    console.log('Connected to the database');

    
});

module.exports = pool;
