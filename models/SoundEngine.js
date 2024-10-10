const mongoose = require('mongoose');

// Regular expression to validate usernames and soundEngineNames
const usernameRegex = /^[a-zA-Z0-9_-]{1,30}$/;

// Regular expression to validate RGB and RGBA formats
const colorRegex = /^rgba?\(\d{1,3},\s*\d{1,3},\s*\d{1,3},?\s*(0|1|0?\.\d+)?\)$/;

// Regular expression to validate URLs (basic)
const urlRegex = /^https?:\/\/.+$/;

const paramSchema = new mongoose.Schema({
    label: {
        type: String,
        required: true,
        default: "Default Label"
    },
    min: {
        type: Number,
        required: true,
        default: 0,
        min: -100,
        max: 100
    },
    max: {
        type: Number,
        required: true,
        default: 100,
        min: -100,
        max: 100
    },
    initValue: {
        type: Number,
        required: true,
        default: 0,
        min: -100,
        max: 100
    }
}, { _id: false });

const soundEngineSchema = new mongoose.Schema({
    ownerId: {
        type: String, // Changed from ObjectId to String to store Supabase UUIDs
        required: true,
        ref: 'User',
        validate: {
            validator: function(v) {
                // UUID v4 validation
                return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
            },
            message: props => `${props.value} is not a valid UUID!`
        },
        index: true // Single-field index for faster queries by ownerId
    },
    isPublic: {
        type: Boolean,
        required: true,
        default: true, // Set default to true
        index: true     // Add index for faster queries
    },
    developerUsername: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        index: true // Single-field index for faster queries by developerUsername
    },
    soundEngineName: {
        type: String,
        required: true,
        trim: true,
        unique: true, // Make soundEngineName unique globally
        match: usernameRegex, // Apply username-like validation
        maxlength: 30
    },
    color1: {
        type: String,
        default: "rgba(255,255,0,1)",
        match: colorRegex // Validate RGB/RGBA format
    },
    color2: {
        type: String,
        default: "rgba(255,255,0,1)",
        match: colorRegex // Validate RGB/RGBA format
    },
    soundEngineFile: {
        type: String,
        default: '',
        // Optional: Validate that it's a valid path or file extension if needed.
        match: /^\/uploads\/soundEngines\/[a-f0-9]{24}\/.+\.(json|JSON)$/
    },
    soundEngineImage: {
        type: String,
        default: '',
        // Optional: Validate that it's a valid image path.
        match: /^\/uploads\/soundEngines\/[a-f0-9]{24}\/.+\.(jpg|jpeg|png|gif)$/
    },
    xParam: {
        type: paramSchema,
        default: () => ({
            label: "Speed",
            min: -100.0,
            max: 100.0,
            initValue: 1.0
        })
    },
    yParam: {
        type: paramSchema,
        default: () => ({
            label: "Tremolo",
            min: -100.0,
            max: 100.0,
            initValue: 0.0
        })
    },
    zParam: {
        type: paramSchema,
        default: () => ({
            label: "SpaceReverb",
            min: -100.0,
            max: 100.0,
            initValue: 0.0
        })
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
        },
        validate: {
            validator: function(arr) {
                return arr.every(url => urlRegex.test(url));
            },
            message: props => `One or more sonification addresses are invalid URLs!`
        }
    },
    credits: {
        type: String,
        default: '',
        maxlength: 500,
        trim: true
    }
}, {
    timestamps: true // Automatically adds createdAt and updatedAt fields
});

// Indexes for performance optimization
soundEngineSchema.index({ ownerId: 1 });
soundEngineSchema.index({ developerUsername: 1 });

// Remove the compound unique index since soundEngineName is now unique globally
// soundEngineSchema.index({ ownerId: 1, soundEngineName: 1 }, { unique: true }); // Remove this line

// Compound index to optimize queries filtering by ownerId and isPublic
soundEngineSchema.index({ ownerId: 1, isPublic: 1 });

// Middleware to handle updates to `sonificationAddresses` based on `sonificationState`
soundEngineSchema.pre('save', function(next) {
    if (this.isModified('sonificationState')) {
        this.sonificationAddresses = this.sonificationState
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
    next();
});

// Model Creation
const SoundEngine = mongoose.model('SoundEngine', soundEngineSchema);

module.exports = SoundEngine;
