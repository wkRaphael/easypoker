// Required Modules
const mariadb = require("mariadb");
require("dotenv").config();

//Initialize Pool
const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 50,
});

// Fetch Connection
async function fetchConn() {
    let conn = await pool.getConnection();
    console.log("Database connected!");
    console.log("Total connections: ", pool.totalConnections());
    console.log("Active connections: ", pool.activeConnections());
    console.log("Idle connections: ", pool.idleConnections());
    return conn;
}

module.exports = {
    fetchConn
}