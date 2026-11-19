
const mysql = require("mysql2");
require("dotenv").config();

const db = mysql.createConnection(
    process.env.MYSQL_PUBLIC_URL
);

db.connect((err) => {
    if (err) {
        console.error("Database connection failed:", err);
        return;
    }

    console.log("Railway MySQL database connected successfully!");
});

module.exports = db;
