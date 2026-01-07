const connectDB = require('../config/db');

class User {
    // Find a user by email
    static async findByEmail(email) {
        const db = await connectDB();
        // SQLite uses '?' as a placeholder just like MySQL
        return db.get('SELECT * FROM users WHERE email = ?', [email]);
    }

    // Create a new user
    static async create(username, email, passwordHash) {
        const db = await connectDB();
        const result = await db.run(
            'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
            [username, email, passwordHash]
        );
        return result;
    }
}

module.exports = User;
