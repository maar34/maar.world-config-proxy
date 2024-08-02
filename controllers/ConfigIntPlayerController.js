const ConfigIntPlayer = require('../models/ConfigIntPlayer');

exports.createConfigIntPlayer = async (req, res) => {
  try {
    const config = new ConfigIntPlayer(req.body);
    await config.save();
    res.status(201).send(config);
  } catch (err) {
    res.status(400).send(err);
  }
};

exports.getConfigIntPlayers = async (req, res) => {
  try {
    const configs = await ConfigIntPlayer.find();
    res.status(200).send(configs);
  } catch (err) {
    res.status(400).send(err);
  }
};
