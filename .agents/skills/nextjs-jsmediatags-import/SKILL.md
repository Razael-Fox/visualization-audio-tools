---
name: nextjs-jsmediatags-import
description: Cara import jsmediatags yang benar di Next.js dengan Turbopack untuk menghindari error react-native-fs
---

# Next.js jsmediatags Import Fix

**Konteks**: Saat menggunakan library `jsmediatags` di Next.js (terutama dengan Turbopack), import default (`import jsmediatags from 'jsmediatags'`) akan menyebabkan build error karena Next.js mencoba me-resolve dependensi untuk React Native (`react-native-fs`) atau Node.js (`fs`, `path`).

## Error yang Sering Terjadi
```
Module not found: Can't resolve 'react-native-fs'
```

## Solusi
Gunakan versi *browser build* (minified) yang sudah di-bundle oleh pembuat library dan panggil hanya ketika berada di *client-side* (browser).

**Kode yang Salah (Jangan Gunakan):**
```typescript
import jsmediatags from "jsmediatags";
```

**Kode yang Benar:**
```typescript
const jsmediatags = typeof window !== "undefined" ? require("jsmediatags/dist/jsmediatags.min.js") : null;
```

Ini akan memastikan Turbopack hanya menyertakan file minified untuk browser yang tidak mengandung `react-native-fs`.
