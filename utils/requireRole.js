const jwt = require('jsonwebtoken');

function verifyJWT(req, res, next) {
    const token = req.headers['authorization'];
    if (!token) return res.status(403).send('Token is required.');

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).send('Failed to authenticate token.');
        req.user = decoded; // Store the decoded token in the request object
        next();
    });
}

function requireRole(role) {
    return function(req, res, next) {
        if (req.user.userRole !== role) {
            return res.status(403).send('Access denied.');
        }
        next();
    };
}

module.exports = { verifyJWT, requireRole };
