const fs = require('fs');
const path = require('path');
const connectDB = require('./config/db');

async function fixBackend() {
    console.log("🔧 Starting Repair...");

    // 1. Create 'uploads' folder if missing
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir);
        console.log("✅ Created 'uploads' folder.");
    } else {
        console.log("✅ 'uploads' folder already exists.");
    }

    // 2. Add 'image_url' column to Database
    const db = await connectDB();
    try {
        await db.exec("ALTER TABLE listings ADD COLUMN image_url TEXT");
        console.log("✅ Database Updated: 'image_url' column added.");
    } catch (err) {
        if (err.message.includes("duplicate column")) {
            console.log("✅ Database is already good (Column exists).");
        } else {
            console.error("⚠️ Database Warning:", err.message);
        }
    }

    console.log("🚀 Backend Repair Complete! You can start the server now.");
}

fixBackend();
