const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { MusicFile } = require('music-tag-native');
const fs = require('fs').promises;

const app = express();
app.use(cors());

const upload = multer({ dest: 'uploads/' });

app.post('/api/embed', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const lyrics = req.body.lyrics || '';
    const metadataStr = req.body.metadata;
    let metadata = null;
    if (metadataStr) {
      try {
         metadata = JSON.parse(metadataStr);
      } catch(e) {}
    }

    const filePath = req.file.path;
    const buffer = await fs.readFile(filePath);
    
    const musicFile = MusicFile.loadSync(buffer);

    // Apply metadata
    if (metadata) {
      if (metadata.title) musicFile.title = metadata.title;
      if (metadata.artist) musicFile.artist = metadata.artist;
      if (metadata.album) musicFile.album = metadata.album;
      if (metadata.year) {
        const yearNum = parseInt(metadata.year, 10);
        if (!isNaN(yearNum)) musicFile.year = yearNum;
      }
      if (metadata.genre) musicFile.genre = metadata.genre;
      if (metadata.track) {
        const trackNum = parseInt(metadata.track, 10);
        if (!isNaN(trackNum)) musicFile.trackNumber = trackNum;
      }
    } else {
      if (!musicFile.title) {
         musicFile.title = req.file.originalname.replace(/\.[^/.]+$/, "") || "Untitled";
      }
    }

    // Prepare lyrics
    let lrcText = lyrics.trim();
    // If not synced, clean timestamps
    if (!lrcText.match(/\[\d+:\d+(?:\.\d+)?\]/)) {
       lrcText = lyrics.replace(/\[\d+:\d+(?:\.\d+)?\]/g, "").trim();
    }
    musicFile.lyrics = lrcText;

    const modifiedBuffer = await musicFile.save(buffer);

    // Clean up temp file
    await fs.unlink(filePath).catch(()=>console.error('Failed to clean temp file'));

    res.set({
      'Content-Type': req.file.mimetype || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${req.file.originalname}"`,
    });
    
    res.send(Buffer.from(modifiedBuffer));
    
  } catch (err) {
    console.error(err);
    // Cleanup on error
    if (req.file && req.file.path) {
      await fs.unlink(req.file.path).catch(()=>{});
    }
    res.status(500).json({ error: err.message || 'Failed to process file' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
