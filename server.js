require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const configIpRoutes = require('./routes/configIpRoutes');
const trackRoutes = require('./routes/trackRoutes');
const userRelationshipsRoutes = require('./routes/userRelationshipsRoutes'); // Import the new UserRelationships routes
const http = require('http');
const rateLimit = require('express-rate-limit');
//const magic = require('./auth'); // Import the Magic authentication module
const User = require('./models/User'); // Import the User model
//const authenticate = require('./auth'); // Import from the root folder
const jwt = require('jsonwebtoken'); // For securely passing user info
//const authRoutes = require('./routes/authRoutes'); 
const profileRoutes = require('./routes/profileRoutes'); // Adjust the path as needed
const playlistRoutes = require('./routes/playlistRoutes'); // Adjust the path as necessary
const soundEnginesRoutes = require('./routes/soundEnginesRoutes');
const authRoutes = require('./routes/authRoutes'); 




const app = express();

// Middleware Setup
app.use(bodyParser.json({ limit: '200mb' }));
app.use(bodyParser.urlencoded({ limit: '200mb', extended: true }));

// CORS configuration
const allowedOrigins = ['http://127.0.0.1:4000', 'http://localhost:4000', 'http://127.0.0.1:4001', 'http://localhost:4001','http://maar.world'];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST'], // Allow these HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allow these headers
}));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 60000, // 1 minute
  socketTimeoutMS: 120000,         // 2 minutes
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// THERES SOMETHING DUPLICATED AND WE NEED THIS TO WORK WITH LINK 

app.use('/api', configIpRoutes); 
app.use('/api', trackRoutes); 
app.use('/api', profileRoutes); // Prefix all routes in profileRoutes.js with /api 

// Use the routes with middleware applied

app.use(express.json());  // Ensure body parsing middleware is enabled
app.use('/api/auth', authRoutes);

//app.use('/api/config', configIpRoutes);
//app.use('/api/tracks', trackRoutes);
//app.use('/api/profile', profileRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/userRelationships', userRelationshipsRoutes);
app.use('/api/playlists', playlistRoutes); // Mount Playlist Routes
app.use('/api/soundEngines', soundEnginesRoutes); // Correctly mount soundEngine routes


app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);  // Logs the request method and URL
  next();
});


// Magic Link Authentication Route
app.post('/login', async (req, res) => {
  const didToken = req.headers.authorization.split('Bearer ').pop();

  try {
      // Validate the DID token
      await magic.token.validate(didToken);

      // Retrieve the authenticated user metadata
      const metadata = await magic.users.getMetadataByToken(didToken);

      // Find or create the user in the database
      let user = await User.findOne({ email: metadata.email });
      if (!user) {
          user = new User({
              email: metadata.email,
              username: metadata.email.split('@')[0], // Default username
              role: 'Listener', // Default role
          });
          await user.save();
      }

      // Generate a JWT with the user's role
      const token = jwt.sign(
        { userId: session.user.id, email: session.user.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
      res.json({ token });
  } catch (error) {
      console.error('Login error:', error);
      res.status(401).json({ error: 'Authentication failed' });
  }
});

// Route to log out a user
app.post('/logout', async (req, res) => {
  const didToken = req.headers.authorization.split('Bearer ').pop();

  try {
    await magic.users.logoutByToken(didToken);
    res.json({ message: 'User logged out' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(401).json({ error: 'Logout failed' });
  }
});

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

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

app.use(limiter);

// Start Server
const PORT = process.env.PORT || 3001;
const server = http.createServer(app);

// Set server timeout to handle longer file uploads
server.setTimeout(20 * 60 * 1000); // 20 minutes

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
