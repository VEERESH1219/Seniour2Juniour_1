const connectDB = require('./config/db');

async function updateTable() {
    const db = await connectDB();
    try {
        await db.exec("ALTER TABLE listings ADD COLUMN image_url TEXT");
        console.log("✅ Database Updated: 'image_url' column added!");
    } catch (err) {
        console.log("ℹ️ Column might already exist or error:", err.message);
    }
}

updateTable();
