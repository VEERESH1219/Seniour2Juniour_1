const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

// Function to open the database connection
async function connectDB() {
    return open({
        filename: path.join(__dirname, '../../database.sqlite'), // Creates file in project root
        driver: sqlite3.Database
    });
}

module.exports = connectDB;
