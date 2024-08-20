const Track = require('../models/Track');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

// Step 1: Handle track metadata submission
exports.submitTrackData = async (req, res) => {
    try {
        // Validate incoming JSON data
        const { exoplanet, artistName, songName, type, genre, mood, additionalTags, description, credits, privacy, releaseDate, licence, enableDirectDownloads } = req.body;

        if (!exoplanet || !artistName || !songName) {
            return res.status(400).json({ error: 'Required fields missing.' });
        }

        // Create a new track instance
        const newTrack = new Track({
            exoplanet,
            artistName,
            songName,
            type,
            genre,
            mood,
            additionalTags,
            description,
            credits,
            privacy,
            releaseDate,
            licence,
            enableDirectDownloads,
            audioFileWAV: '',
            audioFileMP3: '',
            coverImage: ''  // Initialize cover image field
        });

        // Save the track and get the trackId
        await newTrack.save();
        const trackId = newTrack._id;

        res.status(201).json({ trackId });
    } catch (error) {
        console.error('Error submitting track data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Step 2: Handle audio file uploads and cover image upload
exports.uploadTrackFiles = (req, res) => {
    const { trackId } = req.params;

    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            const uploadPath = path.join(__dirname, `../uploads/tracks/${trackId}`);
            if (!fs.existsSync(uploadPath)) {
                fs.mkdirSync(uploadPath, { recursive: true });
            }
            cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
            cb(null, `${Date.now()}_${file.originalname}`);
        }
    });

    const upload = multer({ storage }).fields([
        { name: 'audioFileWAV', maxCount: 1 },
        { name: 'audioFileMP3', maxCount: 1 },
        { name: 'coverImage', maxCount: 1 }  // Add cover image field
    ]);

    upload(req, res, async (err) => {
        if (err) {
            console.error('Error during file upload:', err);
            return res.status(500).json({ error: 'Error during file upload' });
        }

        try {
            const files = req.files;
            const track = await Track.findById(trackId);
            if (!track) {
                return res.status(404).json({ error: 'Track not found' });
            }

            // Update track with actual file paths
            if (files.audioFileWAV && files.audioFileWAV.length > 0) {
                track.audioFileWAV = `/uploads/tracks/${trackId}/${files.audioFileWAV[0].filename}`;
            }

            if (files.audioFileMP3 && files.audioFileMP3.length > 0) {
                track.audioFileMP3 = `/uploads/tracks/${trackId}/${files.audioFileMP3[0].filename}`;
            }

            if (files.coverImage && files.coverImage.length > 0) {
                track.coverImage = `/uploads/tracks/${trackId}/${files.coverImage[0].filename}`;
            }

            // Save the updated track document
            await track.save();

            // Verification step to ensure files are properly saved
            const wavFilePath = path.join(__dirname, `../uploads/tracks/${trackId}/${files.audioFileWAV[0].filename}`);
            const mp3FilePath = path.join(__dirname, `../uploads/tracks/${trackId}/${files.audioFileMP3[0].filename}`);
            const coverImagePath = path.join(__dirname, `../uploads/tracks/${trackId}/${files.coverImage[0].filename}`);

            if (!fs.existsSync(wavFilePath) || !fs.existsSync(mp3FilePath) || !fs.existsSync(coverImagePath)) {
                // If files are missing, clean up and revert the database changes
                await Track.findByIdAndDelete(trackId);  // Revert database entry
                if (fs.existsSync(wavFilePath)) fs.unlinkSync(wavFilePath);
                if (fs.existsSync(mp3FilePath)) fs.unlinkSync(mp3FilePath);
                if (fs.existsSync(coverImagePath)) fs.unlinkSync(coverImagePath);

                return res.status(500).json({ error: 'File upload failed: incomplete files' });
            }

            res.status(200).json({ success: true, message: 'Files uploaded and track updated successfully', track });
        } catch (error) {
            console.error('Error saving track after file upload:', error);

            // Clean up any files that were uploaded
            const uploadDir = path.join(__dirname, `../uploads/tracks/${trackId}`);
            if (fs.existsSync(uploadDir)) {
                fs.rmSync(uploadDir, { recursive: true, force: true });
            }

            // Revert database entry
            await Track.findByIdAndDelete(trackId);

            res.status(500).json({ error: 'Internal server error' });
        }
    });
};
