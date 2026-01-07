const express = require('express');
const router = express.Router();
const listingController = require('../controllers/listingController');
const authMiddleware = require('../middleware/authMiddleware');


const upload = require('../middleware/uploadMiddleware'); // Import it

// Update the POST route to use upload.single('image')
router.post('/', authMiddleware, upload.single('image'), listingController.createListing);

// Public Route: Anyone can see books
router.get('/', listingController.getListings);

// Protected Route: Only logged-in users can add books
// We put 'authMiddleware' before the controller
router.post('/', authMiddleware, listingController.createListing);

// Add this line at the bottom, before module.exports
router.delete('/:id', authMiddleware, listingController.deleteListing);

module.exports = router;
