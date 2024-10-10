// Import Dependencies
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const http = require('http');
const rateLimit = require('express-rate-limit');

// Import Routes
const configIpRoutes = require('./routes/configIpRoutes');
const trackRoutes = require('./routes/trackRoutes');
const profileRoutes = require('./routes/profileRoutes');
const authRoutes = require('./routes/authRoutes'); 
const userRelationshipsRoutes = require('./routes/userRelationshipsRoutes');
const playlistRoutes = require('./routes/playlistRoutes'); 
const soundEnginesRoutes = require('./routes/soundEnginesRoutes');

// Import Models (if needed in server.js)
const User = require('./models/User');

// Initialize Express App
const app = express();

// Apply Body Parsing Middleware BEFORE Routes
app.use(express.json({ limit: '200mb' })); // Increase limit if necessary
app.use(express.urlencoded({ extended: true, limit: '200mb' }));

// CORS Configuration
const allowedOrigins = [
  'http://127.0.0.1:4005', 
  'http://localhost:4005', 
  'http://127.0.0.1:4001', 
  'http://localhost:4001', 
  'http://maar.world'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
}));

// Rate Limiting Middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Serve Static Files (for uploaded models and textures)
app.use('/uploads', express.static('uploads'));

// Register Routes AFTER Body Parsing Middleware
app.use('/api', configIpRoutes); 
app.use('/api', trackRoutes); 
app.use('/api', profileRoutes); 
app.use('/api/auth', authRoutes);
app.use('/api/userRelationships', userRelationshipsRoutes);
app.use('/api/playlists', playlistRoutes);
app.use('/api/soundEngines', soundEnginesRoutes);

// Additional Middleware (Logging)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);  // Logs the request method and URL
  next();
});

// Metadata Routes (if still needed)
app.get('/metadata/exoplanets.json', async (req, res) => {
  try {
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

app.get('/metadata/sonicEngines.json', async (req, res) => {
  try {
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

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 60000, // 1 minute
  socketTimeoutMS: 120000,         // 2 minutes
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Start Server
const PORT = process.env.PORT || 3001;
const server = http.createServer(app);

// Set server timeout to handle longer file uploads
server.setTimeout(20 * 60 * 1000); // 20 minutes

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
