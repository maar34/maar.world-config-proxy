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

// **CORS Configuration**
const allowedOrigins = [
  'http://127.0.0.1:4005', 
  'http://localhost:4005', 
  'http://127.0.0.1:4001', 
  'http://localhost:4001', 
  'http://maar.world'
];

// Apply CORS **before routes** to ensure it applies to all API calls
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // Allow requests with no origin, like mobile apps or CURL
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
  credentials: true // Include credentials if necessary
}));

// **Body Parsing Middleware** (also before routes)
app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ extended: true, limit: '200mb' }));

// **Logging Middleware** (keep this after middleware but before routes)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Rate Limiting Middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per window
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Serve Static Files (for uploaded models and textures)
app.use('/uploads', express.static('uploads'));

// **Routes Definitions (after middleware)**
app.use('/api/soundEngines', soundEnginesRoutes);
app.use('/api/interplanetaryplayers', configIpRoutes);
app.use('/api', trackRoutes); 
app.use('/api', profileRoutes); 
app.use('/api/auth', authRoutes);
app.use('/api/userRelationships', userRelationshipsRoutes);
app.use('/api/playlists', playlistRoutes);

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
