---
name: gemini-model-version
description: Dokumentasi perbaikan model Google Gemini dari gemini-2.5-flash menjadi gemini-1.5-flash karena versi 2.5 tidak tersedia.
---

# Gemini Model Version Fix

**Konteks**: Penggunaan API Google Gemini seringkali salah merujuk ke nama model yang belum tersedia secara publik atau telah usang. Misalnya menggunakan `gemini-2.5-flash` yang akan menyebabkan error 404.

## Error yang Sering Terjadi
```
Error: [GoogleGenerativeAI Error]: Error fetching from ...: [404 Not Found] This model models/gemini-2.5-flash is no longer available to new users.
```

## Solusi
Pastikan selalu menggunakan versi model yang valid dan stabil untuk produksi. Saat ini model terbaru yang paling sering digunakan dan stabil adalah generasi 1.5.

**Kode yang Salah:**
```typescript
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
```

**Kode yang Benar:**
```typescript
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
```
