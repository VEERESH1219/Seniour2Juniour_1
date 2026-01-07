const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    // 1. Get token
    const token = req.header('Authorization');

    // DEBUG: Print what the server received
    console.log("------------------------------------------------");
    console.log("1. Received Token:", token); 

    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        // 2. Define Secret
        const secret = process.env.JWT_SECRET || 'my_temporary_secret_key';
        console.log("2. Using Secret:", secret); // DEBUG

        // 3. Verify
        const decoded = jwt.verify(token, secret);
        console.log("3. Token Verified! User ID:", decoded.id); // DEBUG

        req.user = decoded;
        next();
    } catch (err) {
        // DEBUG: Print the specific error
        console.error("4. Verification Failed:", err.message); 
        res.status(401).json({ message: 'Token is not valid' });
    }
};
