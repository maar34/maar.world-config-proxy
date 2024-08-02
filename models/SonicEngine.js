const mongoose = require('mongoose');
const { Schema } = mongoose;

const SonicEngineSchema = new Schema({}, { strict: false, collection: 'sonic_engines' });

module.exports = mongoose.model('SonicEngine', SonicEngineSchema);
