require('dotenv').config(); // <--- MOVE THIS TO LINE 1
const app = require('./app');
const initializeDB = require('./config/initDB');

const PORT = process.env.PORT || 5000;

// Initialize Database then start server
initializeDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}).catch(err => {
    console.error('Failed to initialize database:', err);
});
