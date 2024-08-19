const express = require('express');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const configRoutes = require('./routes/configRoutes');
const trackRoutes = require('./routes/trackRoutes');
const http = require('http');

dotenv.config();

const app = express();
app.use(bodyParser.json({ limit: '200mb' }));
app.use(bodyParser.urlencoded({ limit: '200mb', extended: true }));

const allowedOrigins = ['http://127.0.0.1:4000', 'http://localhost:4000'];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  }
}));

mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 60000, // 1 minute
  socketTimeoutMS: 120000,         // 2 minutes
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));


app.use('/api', configRoutes);
app.use('/api', trackRoutes);

console.log('Config Routes:', configRoutes);

// Route to fetch exoplanet data
app.get('/metadata/exoplanets.json', async (req, res) => {
  try {
    console.log('Fetching exoplanet data');
    const exoplanets = await Exoplanet.find({}).lean();

    console.log(`Found ${exoplanets.length} exoplanets`);
    if (exoplanets.length > 0) {
      res.json(exoplanets);
    } else {
      res.status(404).json({ message: 'No exoplanets found' });
    }
  } catch (err) {
    console.error('Error fetching exoplanets:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// Route to fetch sonic engine data
app.get('/metadata/sonicEngines.json', async (req, res) => {
  try {
    console.log('Fetching sonic engines');
    const sonicEngines = await SonicEngine.findById('66ab5c2ba02d327c9e5671da').lean();

    if (sonicEngines) {
      const { _id, ...response } = sonicEngines;
      res.json(response);
    } else {
      res.status(404).json({ message: 'No sonic engines found' });
    }
  } catch (err) {
    console.error('Error fetching sonic engines:', err.message);
    res.status(500).json({ message: err.message });
  }
});

const PORT = process.env.PORT || 3001;
const server = http.createServer(app);

// Set server timeout to handle longer file uploads
server.setTimeout(20 * 60 * 1000); // 20 minutes

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
