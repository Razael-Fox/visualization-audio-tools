---
name: opus-metadata-extraction
description: Solusi untuk ekstraksi metadata file audio .opus di browser menggunakan music-metadata alih-alih jsmediatags
---

# Opus Metadata Extraction

**Konteks**: File berformat `.opus` tidak menggunakan standar tag ID3 seperti MP3, melainkan menggunakan Ogg/Vorbis Comments. 

**Masalah**: Library populer seperti `jsmediatags` tidak mendukung format Vorbis Comments / Ogg, sehingga gagal mengekstrak metadata dari file `.opus`.

**Solusi**:
Gunakan library `music-metadata` yang memiliki dukungan jauh lebih luas (termasuk Opus, Ogg, FLAC, M4A, dll) dan kompatibel secara natif di browser (versi terbaru berformat ESM).

```typescript
import { parseBlob } from 'music-metadata';

// ...
try {
  const metadata = await parseBlob(file);
  console.log(metadata.common.title);
} catch (err) {
  console.error("Error membaca metadata", err);
}
```

Pastikan untuk memigrasikan kodingan dari `jsmediatags` ke `music-metadata` jika dukungan format modern seperti `.opus` diperlukan di project.
