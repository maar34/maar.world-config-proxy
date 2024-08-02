const mongoose = require('mongoose');

exports.connect = () => {
  mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000,  // Increase timeout to 30 seconds
    socketTimeoutMS: 45000  // Increase socket timeout to 45 seconds
  })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));
};
