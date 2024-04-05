// Required Modules
const mariadb = require("mariadb");
require("dotenv").config();

let isInitialization = true;
let conn;

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
    if (isInitialization){
        conn = await pool.getConnection();
        isInitialization = false;
    }
    
    console.log("Database connected!");
    console.log("Total connections: ", pool.totalConnections());
    console.log("Active connections: ", pool.activeConnections());
    console.log("Idle connections: ", pool.idleConnections());
    return conn;
}

module.exports = {
    fetchConn
}