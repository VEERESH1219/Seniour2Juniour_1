const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const listingRoutes = require('./routes/listingRoutes'); // ✅ MUST BE HERE

const app = express();

const path = require('path'); // Add this at the very top

// ... existing code ...

app.use(cors());
app.use(express.json());

// ⚠️ ADD THIS LINE: Make the uploads folder public
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); 

app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);



app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes); // ✅ MUST BE HERE

module.exports = app;
