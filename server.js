const express = require('express');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const configRoutes = require('./routes/configRoutes');
const trackRoutes = require('./routes/trackRoutes');
const http = require('http');
const rateLimit = require('express-rate-limit');



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

// OAuth 2.0 Token Exchange Route
app.post('/exchange-token', async (req, res) => {
    const { code } = req.body;

    try {
        const fetch = (await import('node-fetch')).default;  // Dynamically import node-fetch
        const response = await fetch('https://cloud.digitalocean.com/v1/oauth/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                grant_type: 'authorization_code',
                code: code,
                client_id: process.env.CLIENT_ID,
                client_secret: process.env.CLIENT_SECRET,
                redirect_uri: 'https://maar.world/login',
            }),
        });

        const data = await response.json();

        if (data.access_token) {
            res.json({ access_token: data.access_token });
        } else {
            res.status(400).json({ error: 'Token exchange failed' });
        }
    } catch (error) {
        console.error('Error exchanging token:', error);
        res.status(500).json({ error: 'Internal Server Error' });
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

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

app.use(limiter);

const PORT = process.env.PORT || 3001;
const server = http.createServer(app);

// Set server timeout to handle longer file uploads
server.setTimeout(20 * 60 * 1000); // 20 minutes

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
