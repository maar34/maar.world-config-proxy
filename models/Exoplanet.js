const mongoose = require('mongoose');
const { Schema } = mongoose;

const exoplanetSchema = new Schema({}, { strict: false, collection: 'exoplanet_data' });

module.exports = mongoose.model('Exoplanet', exoplanetSchema);
