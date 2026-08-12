const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs').promises;
const { execFile } = require('child_process');
const util = require('util');
const path = require('path');
const execFileAsync = util.promisify(execFile);

const app = express();
app.use(cors());

const upload = multer({ dest: 'uploads/' });

app.post('/api/embed', upload.single('file'), async (req, res) => {
  let outputPath = null;
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

    const inputPath = req.file.path;
    const originalExt = path.extname(req.file.originalname) || '';
    outputPath = inputPath + '_out' + originalExt;
    
    // Prepare lyrics
    let lrcText = lyrics.trim();
    if (!lrcText.match(/\[\d+:\d+(?:\.\d+)?\]/)) {
       lrcText = lyrics.replace(/\[\d+:\d+(?:\.\d+)?\]/g, "").trim();
    }

    const args = ['-y', '-i', inputPath];

    // Apply metadata
    if (metadata) {
      if (metadata.title) args.push('-metadata', `title=${metadata.title}`);
      if (metadata.artist) args.push('-metadata', `artist=${metadata.artist}`);
      if (metadata.album) args.push('-metadata', `album=${metadata.album}`);
      if (metadata.year) {
        const yearNum = parseInt(metadata.year, 10);
        if (!isNaN(yearNum)) args.push('-metadata', `date=${yearNum}`);
      }
      if (metadata.genre) args.push('-metadata', `genre=${metadata.genre}`);
      if (metadata.track) {
        const trackNum = parseInt(metadata.track, 10);
        if (!isNaN(trackNum)) args.push('-metadata', `track=${trackNum}`);
      }
    } else {
      args.push('-metadata', `title=${req.file.originalname.replace(/\.[^/.]+$/, "") || "Untitled"}`);
    }

    if (lrcText) {
      args.push('-metadata', `lyrics=${lrcText}`);
    }

    // Use copy codec to prevent re-encoding and just update tags
    args.push('-c', 'copy', outputPath);

    // Run ffmpeg
    await execFileAsync('ffmpeg', args);

    const modifiedBuffer = await fs.readFile(outputPath);

    // Clean up temp files
    await fs.unlink(inputPath).catch(()=>console.error('Failed to clean temp file'));
    await fs.unlink(outputPath).catch(()=>console.error('Failed to clean out file'));

    res.set({
      'Content-Type': req.file.mimetype || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${req.file.originalname}"`,
    });
    
    res.send(modifiedBuffer);
    
  } catch (err) {
    console.error(err);
    // Cleanup on error
    if (req.file && req.file.path) {
      await fs.unlink(req.file.path).catch(()=>{});
    }
    if (outputPath) {
      await fs.unlink(outputPath).catch(()=>{});
    }
    res.status(500).json({ error: err.message || 'Failed to process file' });
  }
});

const PORT = process.env.PORT || 3099;
app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
});
