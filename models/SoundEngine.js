const mongoose = require('mongoose');

const soundEngineSchema = new mongoose.Schema({
    ownerId: {
        type: String, // Changed from ObjectId to String to store Supabase UUIDs
        required: true,
        ref: 'User'
    },
    availability: {
        type: String,
        enum: ['public', 'private'],
        required: true
    },
    developerUsername: {
        type: String,
        required: true
    },
    soundEngineName: {
        type: String,
        required: true
    },
    color1: {
        type: String,
        default: "rgb(255,255,0)"
    },
    color2: {
        type: String,
        default: "rgb(255,255,0)"
    },
    soundEngineFile: {
        type: String,
        default: ''
    },
    soundEngineImage: {
        type: String,
        default: ''
    },
    xParam: {
        label: {
            type: String,
            default: "Speed"
        },
        min: {
            type: Number,
            default: -1.0
        },
        max: {
            type: Number,
            default: 3.0
        },
        initValue: {
            type: Number,
            default: 1.0
        }
    },
    yParam: {
        label: {
            type: String,
            default: "Tremolo"
        },
        min: {
            type: Number,
            default: -100.0
        },
        max: {
            type: Number,
            default: 100.0
        },
        initValue: {
            type: Number,
            default: 0.0
        }
    },
    zParam: {
        label: {
            type: String,
            default: "Reverb"
        },
        min: {
            type: Number,
            default: -100.0
        },
        max: {
            type: Number,
            default: 100.0
        },
        initValue: {
            type: Number,
            default: 0.0
        }
    },
    sonificationState: {
        type: Boolean,
        default: false
    },
    sonificationAddresses: {
        type: [String],
        default: function () {
            return this.sonificationState
                ? [
                    "data/sonification_1.min.json",
                    "data/sonification_2.min.json",
                    "data/sonification_3.min.json",
                    "data/sonification_4.min.json",
                    "data/sonification_5.min.json",
                    "data/sonification_6.min.json",
                    "data/sonification_7.min.json"
                ]
                : [];
        }
    },
    credits: {
        type: String,
        default: ''
    }
});

const SoundEngine = mongoose.model('SoundEngine', soundEngineSchema);

module.exports = SoundEngine;
