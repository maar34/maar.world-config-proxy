const mongoose = require('mongoose');
const Exoplanet = require('../models/Exoplanet');

exports.updateExoplanet = async (req, res) => {
    const { ipId, artName } = req.body;

    try {
        const ipIdString = ipId.toString(); // Ensure ipId is treated as a string
        
        // Construct the query and update operation to target the nested document
        const updateQuery = {};
        updateQuery[ipIdString + '.artName'] = artName;

        const exoplanet = await Exoplanet.findOneAndUpdate(
            { [ipIdString]: { $exists: true } }, // Query to find the document containing the ipId key
            { $set: updateQuery },
            { new: true, useFindAndModify: false }
        );

        if (exoplanet) {
            res.json({ message: 'Artistic name updated successfully', artName });
        } else {
            res.status(404).json({ message: 'Exoplanet not found' });
        }
    } catch (error) {
        console.error('Error updating artistic name:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};
