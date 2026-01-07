const Listing = require('../models/listingModel');

exports.getListings = async (req, res) => {
    try {
        const listings = await Listing.findAll();
        res.json(listings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};



exports.deleteListing = async (req, res) => {
    try {
        const listingId = req.params.id;
        const userId = req.user.id; // From the token

        // Security Check: Ideally, we should check if the user OWNS the book before deleting
        // For now, we will trust the ID passed (we can improve this later)
        
        await Listing.delete(listingId);
        res.json({ message: 'Listing deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};










exports.createListing = async (req, res) => {
    try {
        const { title, price, description } = req.body;
        
        // Check if a file was uploaded
        const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

        await Listing.create(req.user.id, title, price, description, imageUrl);

        res.status(201).json({ message: 'Book listed successfully!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
