const mongoose = require('mongoose');

const exoplanetSchema = new mongoose.Schema({}, { strict: false });

module.exports = mongoose.model('Exoplanet', exoplanetSchema);
