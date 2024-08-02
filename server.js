const express = require('express');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const SonicEngine = require('./models/SonicEngine');

dotenv.config();

const app = express();
app.use(bodyParser.json({ limit: '50mb' }));

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
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

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
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
