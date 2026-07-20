# Visualization Audio Tools — Architecture & Design Document

**Status:** Active
**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS v4, Mantine UI v7, pnpm.

## System Architecture

Aplikasi ini menggunakan arsitektur **Client-Heavy dengan Server-less API Routes**. Mayoritas pengolahan file audio dilakukan di sisi client (browser) untuk menghindari overhead upload file besar. API Route (Next.js server) murni digunakan sebagai **Proxy Layer** untuk menyembunyikan API Keys (Gemini & Groq) dan berinteraksi dengan layanan AI provider.

### Core Processing Diagram

1. **Client Browser (React/Browser API)**
   - Upload file ditangani di memory browser via `File` atau `Blob`.
   - Rendering UI, Waveform rendering, dan ID3 Tag parsing berjalan di sisi klien (WASM / JS murni).

2. **Next.js API Routes (Server)**
   - `/api/ai/analyze-audio`: Menerima base64 audio, meneruskan ke Gemini 2.5 Flash, mereturn teks insight.
   - `/api/ai/summarize-meta`: Menerima JSON metadata, meneruskan ke Gemini 2.5 Flash, mereturn narasi.
   - `/api/ai/correct-stt`: Menerima teks STT kotor, meneruskan ke Gemini 2.5 Flash, mereturn teks terkoreksi.
   - `/api/stt/transcribe`: Menerima FormData file audio, meneruskan ke Groq (`whisper-large-v3-turbo`), mereturn raw STT text.

## Directory Structure

```
src/
├── app/
│   ├── layout.tsx         # Root layout (MantineProvider)
│   ├── page.tsx           # Landing page (Fitur overview)
│   ├── visualizer/        # Page: Audio Visualizer
│   ├── speech-to-text/    # Page: STT Transcriber
│   ├── metadata/          # Page: Audio Metadata Extractor
│   └── api/               # Server-side proxy / AI Handlers
├── components/
│   ├── layout/            # AppLayout (AppShell, Navbar, Header)
│   ├── AudioVisualizer/   # Waveform canvas logic (WaveSurfer)
│   ├── SpeechToText/      # STT UI, copy/download logic
│   ├── AudioMetadata/     # Parsing ID3 tags (jsmediatags)
│   └── AIInsightPanel/    # Shared komponen untuk hasil analitik AI
```

## UI & UX Design System

1. **Theme & Palette**:
   - Mendukung Dark Mode / Light Mode toggle natively via Mantine.
   - Color coding unik untuk tiap fitur agar mudah dikenali:
     - **Visualizer**: Violet / Purple gradients
     - **Speech-to-Text**: Teal / Emerald gradients
     - **Metadata Extractor**: Orange / Amber gradients
2. **Layout Framework**:
   - Menggunakan `AppShell` dari Mantine untuk sidebar navigasi dan top header yang responsif.
   - Tombol sidebar bersifat sticky dan menyoroti halaman aktif (`usePathname`).
3. **Component Styling**:
   - Komponen primitif menggunakan `Mantine UI` (Card, Button, Group, Stack, Text).
   - Layouting custom dan micro-styling (seperti gradients, flex-box helpers) menggunakan `Tailwind CSS`.
4. **AI Panel Standard**:
   - Output AI selalu menggunakan komponen reusable `AIInsightPanel`.
   - Menggunakan gaya UI _collapsible card_ dengan icon "Sparkles" (Lucide) untuk menandakan fitur cerdas.

## State Management

- Tidak ada global state management rumit (Zustand/Redux tidak digunakan) karena setiap tools bersifat independen.
- Component state lokal (`useState`) dirasa cukup untuk menangani UI state, loading states, dan penyimpanan metadata/transkripsi sementara.
- URL Routing ditangani murni oleh _Next.js App Router_.

## Modul dan Library Inti

- `wavesurfer.js`: Render Waveform real-time.
- `jsmediatags`: Ekstrak ID3 tag metadata file MP3/WAV dari buffer browser.
- `@google/generative-ai`: Interaksi dengan Gemini API.
- `groq-sdk`: Transkripsi STT super cepat dari ekosistem OpenAI Whisper.
- `lucide-react`: Seluruh ikon UI.

## Aturan untuk AI Agents Selanjutnya

1. **Dilarang memindahkan komponen ke Server Component secara sembarangan**: Komponen fitur murni (Visualizer, STT) membutuhkan interaksi DOM atau browser APIs (`window`, `AudioContext`, `File`), sehingga **wajib** berupa `"use client"`.
2. **Gunakan Mantine untuk struktur UI**: Hindari membuat tombol atau card manual dengan Tailwind jika komponen Mantine sudah menyediakannya. Gunakan Tailwind hanya untuk utility margin/padding/color yang tidak tertutup oleh props Mantine.
3. **Pemisahan Logika AI**: Semua pemanggilan provider AI (Gemini/Groq) harus lewat `/api/*` untuk keamanan API Key. Dilarang hardcode API Key atau memanggil SDK AI di sisi client component.
