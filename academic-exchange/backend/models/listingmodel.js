const connectDB = require('../config/db');

class Listing {
    // Get all books
    static async findAll() {
            const db = await connectDB();
            // ADDED users.email here 👇
            return db.all(`
                SELECT listings.*, users.username, users.email
                FROM listings 
                JOIN users ON listings.user_id = users.id 
                ORDER BY created_at DESC
            `);
        }

    // Update arguments to accept imageUrl
        static async create(userId, title, price, description, imageUrl) {
            const db = await connectDB();
            return db.run(
                'INSERT INTO listings (user_id, title, price, description, image_url) VALUES (?, ?, ?, ?, ?)',
                [userId, title, price, description, imageUrl]
            );
        }    
    // Delete a book
    static async delete(id) {
        const db = await connectDB();
        return db.run('DELETE FROM listings WHERE id = ?', [id]);
    }
}

module.exports = Listing;
