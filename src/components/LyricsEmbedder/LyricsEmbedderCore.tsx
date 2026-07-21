"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import WaveSurfer from "wavesurfer.js";
import {
  Button,
  Card,
  Group,
  Stack,
  Text,
  FileButton,
  ActionIcon,
  Alert,
  Collapse,
  Skeleton,
  Textarea,
  Tabs,
  Badge,
  useMantineTheme,
  useComputedColorScheme,
  Grid,
  ScrollArea,
  Divider,
  Title,
  Loader,
  Progress,
} from "@mantine/core";
import {
  Play,
  Pause,
  Square,
  Upload,
  AlertCircle,
  FileText,
  Download,
  Music,
  CheckCircle,
  Clock,
  Sparkles,
  Clipboard,
} from "lucide-react";

// Animated Step Counter component for smooth 0/100 -> 1/100 step increments
function AnimatedCounter({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    if (displayValue === value) return;

    const diff = Math.abs(value - displayValue);
    const stepMs = Math.max(12, Math.min(80, Math.floor(400 / diff)));

    const timer = setInterval(() => {
      setDisplayValue((prev) => {
        if (prev < value) return prev + 1;
        if (prev > value) return prev - 1;
        clearInterval(timer);
        return prev;
      });
    }, stepMs);

    return () => clearInterval(timer);
  }, [value, displayValue]);

  return (
    <span className="inline-block transition-all duration-300 font-mono font-semibold">
      {displayValue}
    </span>
  );
}
import { parseBlob } from "music-metadata";
import { useUsageLimit } from "@/hooks/useUsageLimit";

// We import browser-id3-writer dynamically or normally. Since it's client-side only, we can import it.
// To avoid SSR issues with Node APIs if any, we'll wrap the writing logic safely.
import { ID3Writer } from "browser-id3-writer";

interface SyncedLyric {
  time: number; // in seconds
  text: string;
}

interface AudioMetadata {
  title?: string;
  artist?: string;
  album?: string;
  year?: string;
  genre?: string;
  track?: string;
  picture?: {
    format: string;
    data: number[];
  };
}

// Parse timestamp to seconds helper
const parseTimestamp = (tsStr: string): number | null => {
  const cleanStr = tsStr.replace(",", ".");
  let normalizedStr = cleanStr;
  const colonCount = (normalizedStr.match(/:/g) || []).length;
  if (colonCount === 2) {
    const lastColonIndex = normalizedStr.lastIndexOf(":");
    const lastPart = normalizedStr.substring(lastColonIndex + 1);
    if (lastPart.length <= 2) {
      normalizedStr =
        normalizedStr.substring(0, lastColonIndex) + "." + lastPart;
    }
  }

  const parts = normalizedStr.split(":");
  if (parts.length === 0) return null;

  let seconds = 0;
  let multiplier = 1;

  for (let i = parts.length - 1; i >= 0; i--) {
    const val = parseFloat(parts[i]);
    if (isNaN(val)) return null;

    seconds += val * multiplier;
    multiplier *= 60;
  }

  return seconds;
};

// Parse LRC Helper
const parseLRC = (text: string): SyncedLyric[] => {
  const lines = text.split(/\r?\n/);
  const result: SyncedLyric[] = [];
  const timeRegex = /[\[\(]\s*(\d+(?:[:\.,]\d+)+)\s*[\]\)]/g;

  for (const line of lines) {
    timeRegex.lastIndex = 0;
    const timestamps: number[] = [];
    let match;
    while ((match = timeRegex.exec(line)) !== null) {
      const parsedTime = parseTimestamp(match[1]);
      if (parsedTime !== null) {
        timestamps.push(parsedTime);
      }
    }

    if (timestamps.length > 0) {
      const cleanText = line
        .replace(/[\[\(]\s*\d+(?:[:\.,]\d+)+\s*[\]\)]/g, "")
        .trim();
      for (const time of timestamps) {
        result.push({ time, text: cleanText });
      }
    }
  }

  return result.sort((a, b) => a.time - b.time);
};

// Generate LRC Helper
const generateLRC = (items: SyncedLyric[]): string => {
  return items
    .map((line) => {
      const min = Math.floor(line.time / 60);
      const sec = Math.floor(line.time % 60);
      const ms = Math.round((line.time % 1) * 100);

      const minStr = min.toString().padStart(2, "0");
      const secStr = sec.toString().padStart(2, "0");
      const msStr = ms.toString().padStart(2, "0");

      return `[${minStr}:${secStr}.${msStr}] ${line.text}`;
    })
    .join("\n");
};

export function LyricsEmbedderCore() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const requestRef = useRef<number>(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const theme = useMantineTheme();
  const colorScheme = useComputedColorScheme("dark");

  const waveColor =
    colorScheme === "dark" ? theme.colors.pink[8] : theme.colors.pink[2];
  const progressColor =
    colorScheme === "dark" ? theme.colors.pink[4] : theme.colors.pink[6];
  const cursorColor =
    colorScheme === "dark" ? theme.colors.pink[2] : theme.colors.pink[8];

  // Files state
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioFileName, setAudioFileName] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<AudioMetadata | null>(null);
  const [lyricsText, setLyricsText] = useState<string>("");

  // Wavesurfer Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isReady, setIsReady] = useState(false);

  // Sync state
  const [syncLines, setSyncLines] = useState<{ text: string; time?: number }[]>(
    [],
  );
  const [currentSyncIndex, setCurrentSyncIndex] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<string>("editor");

  // Pure functions/calculations from state
  const syncedLyrics = useMemo(() => parseLRC(lyricsText), [lyricsText]);

  const activeLyricIndex = useMemo(() => {
    if (syncedLyrics.length === 0) return -1;
    let activeIdx = -1;
    for (let i = 0; i < syncedLyrics.length; i++) {
      if (currentTime >= syncedLyrics[i].time) {
        activeIdx = i;
      } else {
        break;
      }
    }
    return activeIdx;
  }, [currentTime, syncedLyrics]);

  const previewViewportRef = useRef<HTMLDivElement | null>(null);

  // Smooth scroll to active lyric without stutter on mobile
  useEffect(() => {
    if (previewViewportRef.current && activeLyricIndex !== -1) {
      const activeEl = previewViewportRef.current.querySelector(
        `[data-lyric-index="${activeLyricIndex}"]`,
      );
      if (activeEl) {
        const top = (activeEl as HTMLElement).offsetTop;
        previewViewportRef.current.scrollTo({
          top:
            top -
            previewViewportRef.current.clientHeight / 2 +
            (activeEl as HTMLElement).clientHeight / 2,
          behavior: "smooth",
        });
      }
    }
  }, [activeLyricIndex]);

  // Output/Embed state
  const [embedProgress, setEmbedProgress] = useState<
    "idle" | "embedding" | "success" | "error"
  >("idle");
  const [limitError, setLimitError] = useState<string | null>(null);
  const [embedError, setEmbedError] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const [aiSyncLoading, setAiSyncLoading] = useState(false);
  const [aiSyncError, setAiSyncError] = useState<string | null>(null);
  const [aiSyncSuccess, setAiSyncSuccess] = useState<boolean>(false);

  const {
    canUpload,
    canGenerateAi,
    incrementUpload,
    incrementAi,
    checkDuration,
  } = useUsageLimit();

  // LRC Helpers are defined at module level outside of the component

  // Format Time Helper
  const formatTime = (time: number) => {
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec < 10 ? "0" : ""}${sec}`;
  };

  // Init wavesurfer colors updating
  useEffect(() => {
    if (wavesurfer.current) {
      wavesurfer.current.setOptions({
        waveColor,
        progressColor,
        cursorColor,
      });
    }
  }, [waveColor, progressColor, cursorColor]);

  // Init wavesurfer
  useEffect(() => {
    if (!containerRef.current) return;

    wavesurfer.current = WaveSurfer.create({
      container: containerRef.current,
      waveColor,
      progressColor,
      cursorColor,
      barWidth: 1,
      barGap: 0,
      height: 24, // Thin seekbar/timeline
      normalize: true,
    });

    const drawWaveform = () => {
      if (!analyserRef.current || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const analyser = analyserRef.current;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const draw = () => {
        requestRef.current = requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const center = canvas.height / 2;
        const barWidth = (canvas.width / bufferLength) * 1.5;
        let x = 0;

        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, "#f472b6"); // pink-400
        gradient.addColorStop(0.5, "#db2777"); // pink-600
        gradient.addColorStop(1, "#f472b6"); // pink-400

        for (let i = 0; i < bufferLength; i++) {
          const rawHeight = dataArray[i];
          const barHeight = (rawHeight / 255) * (canvas.height * 0.85);

          ctx.fillStyle = gradient;
          ctx.fillRect(x, center - barHeight / 2, barWidth - 1.5, barHeight);

          x += barWidth;
        }
      };

      draw();
    };

    wavesurfer.current.on("ready", () => {
      setIsReady(true);
      setDuration(wavesurfer.current?.getDuration() || 0);

      // Init Web Audio API connection
      if (!audioCtxRef.current) {
        try {
          const audioCtx = new (
            window.AudioContext ||
            (
              window as typeof window & {
                webkitAudioContext: typeof AudioContext;
              }
            ).webkitAudioContext
          )();
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;

          const media = wavesurfer.current?.getMediaElement();
          if (media) {
            const source = audioCtx.createMediaElementSource(media);
            source.connect(analyser);
            analyser.connect(audioCtx.destination);

            audioCtxRef.current = audioCtx;
            analyserRef.current = analyser;
          }
        } catch (e) {
          console.error("Web Audio API error", e);
        }
      }
    });

    wavesurfer.current.on("play", () => {
      setIsPlaying(true);
      if (audioCtxRef.current?.state === "suspended") {
        audioCtxRef.current.resume();
      }
      drawWaveform();
    });

    wavesurfer.current.on("pause", () => {
      setIsPlaying(false);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    });

    wavesurfer.current.on("finish", () => {
      setIsPlaying(false);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    });

    wavesurfer.current.on("timeupdate", (time) => {
      setCurrentTime(time);
    });

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      wavesurfer.current?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Synchronously update lyricsText and reset/update syncLines
  const handleLyricsTextChange = (text: string) => {
    setLyricsText(text);

    const parsed = parseLRC(text);
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.replace(/\[\d+:\d+(?:\.\d+)?\]/g, "").trim())
      .filter((line) => line.length > 0);

    if (parsed.length > 0) {
      setSyncLines(
        parsed.map((item) => ({
          text: item.text,
          time: item.time,
        })),
      );
      setCurrentSyncIndex(parsed.length);
    } else {
      setSyncLines(lines.map((line) => ({ text: line })));
      setCurrentSyncIndex(0);
    }
  };

  // AI-powered auto-sync method using API route
  const handleAiSync = async () => {
    if (!audioFile || !lyricsText.trim()) return;
    setLimitError(null);
    setEmbedError(null);
    setAiSyncError(null);
    setAiSyncSuccess(false);

    if (!canGenerateAi) {
      setLimitError(
        "You have reached the AI generation limit for this session.",
      );
      return;
    }

    setAiSyncLoading(true);
    const formData = new FormData();
    formData.append("file", audioFile);
    // Strip existing timestamps first so we send clean lyrics to the AI to align
    const cleanLyrics = lyricsText.replace(/\[\d+:\d+(?:\.\d+)?\]/g, "").trim();
    formData.append("lyrics", cleanLyrics);

    try {
      await incrementAi();

      const res = await fetch("/api/ai/sync-lyrics", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to align lyrics using AI");
      }

      if (data.lrc) {
        // Validate if there are any timestamps returned
        const parsed = parseLRC(data.lrc);
        if (parsed.length === 0) {
          throw new Error(
            "AI completed but returned no valid timestamps. Please verify your lyrics and audio track.",
          );
        }

        // Successfully got synced LRC from AI! Update states
        handleLyricsTextChange(data.lrc);
        setAiSyncSuccess(true);
        // Switch to the preview tab after showing success message
        setTimeout(() => {
          setActiveTab("preview");
        }, 2000);
      } else {
        throw new Error("Invalid response from AI");
      }
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : String(err);
      setAiSyncError(errMsg);
    } finally {
      setAiSyncLoading(false);
    }
  };

  // Paste lyrics directly from clipboard
  const handlePasteFromClipboard = async () => {
    try {
      if (typeof window === "undefined" || !navigator?.clipboard?.readText) {
        throw new Error(
          "Clipboard API is not supported by your browser or device.",
        );
      }
      const text = await navigator.clipboard.readText();
      if (text) {
        handleLyricsTextChange(text);
      }
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : String(err);
      const isPermissionBlocked =
        errMsg.toLowerCase().includes("permissions policy") ||
        errMsg.toLowerCase().includes("notallowederror") ||
        errMsg.toLowerCase().includes("permission");

      if (isPermissionBlocked) {
        setEmbedError(
          "Akses Clipboard diblokir oleh kebijakan keamanan browser/iframe. Kolom teks telah difokuskan — silakan lakukan tempel manual (Ctrl+V / Cmd+V / Tahan & Tempel).",
        );
      } else {
        setEmbedError(`Gagal mengambil dari clipboard: ${errMsg}`);
      }
      textareaRef.current?.focus();
    }
  };

  // Handle music file upload
  const handleAudioUpload = async (file: File | null) => {
    if (!file || !wavesurfer.current) return;
    setLimitError(null);
    setEmbedProgress("idle");
    setDownloadUrl(null);

    if (!canUpload) {
      setLimitError(
        "You have reached the maximum upload limit for this session.",
      );
      return;
    }

    const isValidDuration = await checkDuration(file);
    if (!isValidDuration) {
      setLimitError("Audio file exceeds the 10-minute duration limit.");
      return;
    }

    await incrementUpload();

    setAudioFile(file);
    setAudioFileName(file.name);
    setIsReady(false);
    setCurrentTime(0);
    setDuration(0);

    const url = URL.createObjectURL(file);
    wavesurfer.current.load(url);

    // Read existing metadata
    try {
      const parsedMetadata = await parseBlob(file);
      const common = parsedMetadata.common;

      setMetadata({
        title: common.title,
        artist: common.artist,
        album: common.album,
        year: common.year?.toString(),
        genre: common.genre?.join(", "),
        track: common.track?.no?.toString(),
        picture:
          common.picture && common.picture.length > 0
            ? {
                format: common.picture[0].format,
                data: Array.from(common.picture[0].data),
              }
            : undefined,
      });

      // If lyrics are already embedded, load them!
      if (common.lyrics && common.lyrics.length > 0) {
        // Simple USLT lyric loaded
        handleLyricsTextChange(common.lyrics.join("\n"));
      }
    } catch (err) {
      console.error("Error reading tags:", err);
    }
  };

  // Handle lyrics file upload
  const handleLyricsUpload = async (file: File | null) => {
    if (!file) return;
    const text = await file.text();
    handleLyricsTextChange(text);

    // Auto-detect tab based on content
    if (text.includes("[00:") || text.includes("[01:")) {
      setActiveTab("preview");
    } else {
      setActiveTab("editor");
    }
  };

  // Handled lyrics Text changes using handleLyricsTextChange helper

  // Tap-to-sync triggers
  const handleTapSync = () => {
    if (!wavesurfer.current || currentSyncIndex >= syncLines.length) return;

    const time = wavesurfer.current.getCurrentTime();
    const updated = [...syncLines];
    updated[currentSyncIndex] = { ...updated[currentSyncIndex], time };
    setSyncLines(updated);

    // Auto scroll the sync list
    setCurrentSyncIndex((prev) => prev + 1);

    // Reconstruct LRC text
    const syncedItems: SyncedLyric[] = updated
      .filter((line) => line.time !== undefined)
      .map((line) => ({ time: line.time!, text: line.text }));

    // We update the lyricsText with newly generated timestamps, plus keeping unsynced ones
    const syncedLrcText = generateLRC(syncedItems);
    const unsyncedText = updated
      .slice(syncedItems.length)
      .map((line) => line.text)
      .join("\n");

    setLyricsText(syncedLrcText + (unsyncedText ? "\n" + unsyncedText : ""));
  };

  const handleResetSync = () => {
    setSyncLines(syncLines.map((line) => ({ text: line.text })));
    setCurrentSyncIndex(0);
    // Remove all timestamps from lyrics text
    const cleanText = lyricsText.replace(/\[\d+:\d+(?:\.\d+)?\]/g, "").trim();
    setLyricsText(cleanText);
  };

  const handleAdjustLineTime = (
    index: number,
    action: "forward" | "backward",
  ) => {
    const updated = [...syncLines];
    const line = updated[index];
    if (line.time === undefined) return;

    const adjustment = action === "forward" ? 0.25 : -0.25;
    line.time = Math.max(0, line.time + adjustment);
    setSyncLines(updated);

    const syncedItems: SyncedLyric[] = updated
      .filter((l) => l.time !== undefined)
      .map((l) => ({ time: l.time!, text: l.text }));
    setLyricsText(generateLRC(syncedItems));
  };

  const togglePlay = () => wavesurfer.current?.playPause();
  const stopAudio = () => {
    wavesurfer.current?.stop();
    setIsPlaying(false);
  };

  // Embed process
  const handleEmbedLyrics = async () => {
    if (!audioFile) return;

    setEmbedProgress("embedding");
    setEmbedError(null);

    try {
      const arrayBuffer = await audioFile.arrayBuffer();
      const writer = new ID3Writer(arrayBuffer);

      // 1. Write back existing metadata to avoid losing it
      if (metadata) {
        if (metadata.title) writer.setFrame("TIT2", metadata.title);
        if (metadata.artist) writer.setFrame("TPE1", [metadata.artist]);
        if (metadata.album) writer.setFrame("TALB", metadata.album);
        if (metadata.year) {
          const yearNum = parseInt(metadata.year, 10);
          if (!isNaN(yearNum)) {
            writer.setFrame("TYER", yearNum);
          }
        }
        if (metadata.genre) writer.setFrame("TCON", [metadata.genre]);
        if (metadata.track) writer.setFrame("TRCK", metadata.track);

        if (metadata.picture) {
          const uint8 = new Uint8Array(metadata.picture.data);
          writer.setFrame("APIC", {
            type: 3,
            data: uint8.buffer,
            description: "Cover Front",
          });
        }
      } else {
        // Fallback title to audio filename
        writer.setFrame(
          "TIT2",
          audioFileName?.replace(/\.[^/.]+$/, "") || "Untitled",
        );
      }

      // 2. Format unsynchronized lyrics text (USLT)
      // Strip timestamps for clean reading
      const cleanLyricsText = lyricsText
        .replace(/\[\d+:\d+(?:\.\d+)?\]/g, "")
        .trim();
      writer.setFrame("USLT", {
        language: "eng",
        description: "Lyrics",
        lyrics: cleanLyricsText,
      });

      // 3. If there are synchronized lyrics, write the SYLT frame
      if (syncedLyrics.length > 0) {
        writer.setFrame("SYLT", {
          language: "eng",
          timestampFormat: 2, // Absolute time in milliseconds
          type: 1, // Lyrics
          description: "Lyrics Sync",
          text: syncedLyrics.map(
            (item) => [item.text, Math.round(item.time * 1000)] as const,
          ),
        });
      }

      // Write tags and build file blob
      const taggedBuffer = writer.addTag();
      const blob = new Blob([taggedBuffer], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);

      setDownloadUrl(url);
      setEmbedProgress("success");
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : String(err);
      setEmbedError(errMsg || "Failed to embed lyrics tags.");
      setEmbedProgress("error");
    }
  };

  const getDownloadName = () => {
    if (!audioFileName) return "song_with_lyrics.mp3";
    const dotIndex = audioFileName.lastIndexOf(".");
    if (dotIndex === -1) return `${audioFileName}_with_lyrics.mp3`;
    return `${audioFileName.substring(0, dotIndex)}_with_lyrics.mp3`;
  };

  return (
    <Card withBorder shadow="sm" radius="md" p="xl" className="w-full">
      <Stack gap="lg">
        {limitError && (
          <Alert
            icon={<AlertCircle size={16} />}
            title="Upload limit reached"
            color="red"
            variant="light"
            withCloseButton
            onClose={() => setLimitError(null)}
          >
            {limitError}
          </Alert>
        )}

        {/* Title Header */}
        <Group justify="space-between" align="flex-start">
          <Group gap="sm" align="center">
            <Music size={28} className="text-pink-500" />
            <div>
              <Text fw={700} size="xl">
                Lyrics Audio Embedder
              </Text>
              <Text size="sm" c="dimmed">
                Insert lyrics directly into your song files. Use a .lrc file for
                lyrics that scroll automatically as the song plays, or a .txt
                file for standard static text.
              </Text>
            </div>
          </Group>
          <Group gap="xs">
            <FileButton
              onChange={handleAudioUpload}
              accept="audio/mpeg,audio/mp3"
            >
              {(props) => (
                <Button
                  {...props}
                  leftSection={<Upload size={16} />}
                  variant="light"
                  color="pink"
                >
                  Upload Music (.mp3)
                </Button>
              )}
            </FileButton>
            <FileButton onChange={handleLyricsUpload} accept=".lrc,.txt">
              {(props) => (
                <Button
                  {...props}
                  leftSection={<FileText size={16} />}
                  variant="outline"
                  color="gray"
                  disabled={!audioFile}
                >
                  Upload Lyrics (.lrc/.txt)
                </Button>
              )}
            </FileButton>
          </Group>
        </Group>

        <Collapse expanded={!!audioFileName}>
          <Stack gap="md" mt="xs">
            {/* Waveform Player */}
            <div className="relative w-full rounded-md border border-gray-200 dark:border-dark-500 overflow-hidden bg-gray-50 dark:bg-dark-700 p-4">
              <Text size="xs" c="dimmed" mb="xs">
                Loaded track:{" "}
                <span className="font-semibold text-pink-500">
                  {audioFileName}
                </span>
                {metadata?.title &&
                  ` (${metadata.artist || "Unknown Artist"} - ${metadata.title})`}
              </Text>

              {!isReady && <Skeleton height={132} radius="md" animate />}

              <div
                className={`flex flex-col gap-2 ${!isReady ? "hidden" : ""}`}
              >
                {/* Real-time Animated Waveform Canvas */}
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={100}
                  className="w-full h-[100px] bg-dark-800 dark:bg-dark-900 rounded-md shadow-inner pointer-events-none"
                />

                {/* Thin Seeker Timeline */}
                <div ref={containerRef} className="w-full min-h-[24px]" />
              </div>

              {isReady && (
                <Group justify="space-between" mt="xs">
                  <Text size="xs" c="dimmed" fw={500}>
                    {formatTime(currentTime)}
                  </Text>
                  <Text size="xs" c="dimmed" fw={500}>
                    {formatTime(duration)}
                  </Text>
                </Group>
              )}

              <Group mt="sm">
                <ActionIcon
                  size="lg"
                  variant="filled"
                  color="pink"
                  onClick={togglePlay}
                  disabled={!isReady}
                >
                  {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                </ActionIcon>
                <ActionIcon
                  size="lg"
                  variant="light"
                  color="red"
                  onClick={stopAudio}
                  disabled={!isReady}
                >
                  <Square size={18} />
                </ActionIcon>
                {syncedLyrics.length > 0 && (
                  <Badge
                    color="pink"
                    variant="light"
                    leftSection={<Clock size={12} />}
                  >
                    {syncedLyrics.length} Synced Lines
                  </Badge>
                )}
              </Group>
            </div>

            {/* Editing Section */}
            {/* Editing Section with Mini Desktop Navbar */}
            <Tabs
              variant="unstyled"
              value={activeTab}
              onChange={(val) => val && setActiveTab(val)}
              className="w-full"
            >
              <div className="w-full flex items-center justify-between gap-2 p-1.5 mb-2 bg-gray-900/80 dark:bg-dark-800/80 border border-gray-800/80 rounded-2xl backdrop-blur-xl shadow-inner">
                <Tabs.List className="flex items-center gap-1.5 w-full overflow-x-auto scrollbar-none py-0.5 px-0.5">
                  <Tabs.Tab
                    value="editor"
                    leftSection={
                      <FileText
                        size={13}
                        className={
                          activeTab === "editor"
                            ? "text-white"
                            : "text-pink-400"
                        }
                      />
                    }
                    className={`group relative px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 flex items-center gap-2 cursor-pointer border ${
                      activeTab === "editor"
                        ? "bg-gradient-to-r from-pink-600 to-pink-500 text-white border-pink-400/30 shadow-sm shadow-pink-500/20 font-semibold"
                        : "border-transparent text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    Raw Editor
                    {activeTab === "editor" && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    )}
                  </Tabs.Tab>

                  <Tabs.Tab
                    value="sync"
                    leftSection={
                      <Clock
                        size={13}
                        className={
                          activeTab === "sync" ? "text-white" : "text-pink-400"
                        }
                      />
                    }
                    disabled={!lyricsText.trim()}
                    className={`group relative px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 flex items-center gap-2 cursor-pointer border ${
                      activeTab === "sync"
                        ? "bg-gradient-to-r from-pink-600 to-pink-500 text-white border-pink-400/30 shadow-sm shadow-pink-500/20 font-semibold"
                        : !lyricsText.trim()
                          ? "border-transparent opacity-40 cursor-not-allowed text-gray-500"
                          : "border-transparent text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    Tap Sync Tool
                    {activeTab === "sync" && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    )}
                  </Tabs.Tab>

                  <Tabs.Tab
                    value="preview"
                    leftSection={
                      <Sparkles
                        size={13}
                        className={
                          activeTab === "preview"
                            ? "text-white"
                            : "text-pink-400"
                        }
                      />
                    }
                    disabled={syncedLyrics.length === 0}
                    className={`group relative px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 flex items-center gap-2 cursor-pointer border ${
                      activeTab === "preview"
                        ? "bg-gradient-to-r from-pink-600 to-pink-500 text-white border-pink-400/30 shadow-sm shadow-pink-500/20 font-semibold"
                        : syncedLyrics.length === 0
                          ? "border-transparent opacity-40 cursor-not-allowed text-gray-500"
                          : "border-transparent text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    Live LRC Player
                    {activeTab === "preview" && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    )}
                  </Tabs.Tab>
                </Tabs.List>
              </div>

              <Tabs.Panel value="editor" pt="md">
                <Stack gap="xs">
                  <Text size="sm" c="dimmed" component="div">
                    <Text fw={600} size="sm" c="pink" mb="xs">
                      How to add lyrics:
                    </Text>
                    <ul className="list-disc pl-5 space-y-1 text-xs">
                      <li>
                        <strong>If you have a synchronized (.lrc) file:</strong>{" "}
                        Upload it above or paste it here to view, edit, or
                        preview it directly.
                      </li>
                      <li>
                        <strong>If you have plain text lyrics:</strong> Paste
                        the text below, then switch to the{" "}
                        <strong>&quot;Tap Sync Tool&quot;</strong> tab to align
                        them manually, or use{" "}
                        <strong>&quot;Auto-Sync with AI&quot;</strong>.
                      </li>
                      <li>
                        <strong>Writing manually:</strong> Simply type your
                        lyrics line-by-line in the text area below.
                      </li>
                    </ul>
                  </Text>

                  <div className="flex flex-col gap-1 mt-1">
                    <Text size="xs" c="dimmed">
                      atau paste dari clipboard:
                    </Text>
                    <Button
                      variant="light"
                      color="pink"
                      size="xs"
                      onClick={handlePasteFromClipboard}
                      className="self-start"
                      leftSection={<Clipboard size={14} />}
                    >
                      Paste dari Clipboard
                    </Button>
                  </div>

                  <Textarea
                    ref={textareaRef}
                    placeholder="[00:10.50]Line 1
[00:15.20]Line 2
... or paste unsynchronized text here to sync it."
                    value={lyricsText}
                    onChange={(e) => handleLyricsTextChange(e.target.value)}
                    minRows={10}
                    autosize
                    className="font-mono text-sm"
                  />
                </Stack>
              </Tabs.Panel>

              <Tabs.Panel value="sync" pt="md">
                <Grid>
                  <Grid.Col span={{ base: 12, md: 8 }}>
                    <Stack gap="md">
                      {aiSyncLoading && (
                        <Alert
                          title="AI is Syncing Lyrics"
                          color="pink"
                          variant="light"
                        >
                          Please wait. Gemini AI is listening to the song and
                          matching it line-by-line with your lyrics... (this may
                          take 15 to 30 seconds).
                        </Alert>
                      )}

                      {aiSyncSuccess && (
                        <Alert
                          icon={<CheckCircle size={16} />}
                          title="Auto-Sync Completed!"
                          color="green"
                          variant="light"
                        >
                          AI has successfully aligned the lyrics! Redirecting
                          you to the preview player...
                        </Alert>
                      )}

                      {aiSyncError && (
                        <Alert
                          icon={<AlertCircle size={16} />}
                          title="AI Auto-Sync Failed"
                          color="red"
                          variant="light"
                        >
                          {aiSyncError}
                        </Alert>
                      )}

                      <div className="bg-gray-50 dark:bg-dark-600 p-4 rounded border border-gray-100 dark:border-dark-500">
                        <Stack gap="xs">
                          <div>
                            <Text size="md" fw={700} c="pink">
                              How to Sync:
                            </Text>
                            <Text size="xs" c="dimmed" mt="xs">
                              Play the music. Press the button below at the
                              exact moment each highlighted line starts.
                            </Text>
                          </div>

                          <Stack gap="xs" mt="xs">
                            <Button
                              variant="light"
                              color="pink"
                              size="sm"
                              leftSection={<Sparkles size={14} />}
                              loading={aiSyncLoading}
                              onClick={handleAiSync}
                              disabled={!audioFile || !lyricsText.trim()}
                              fullWidth
                            >
                              {aiSyncLoading
                                ? "AI is Aligning Lyrics..."
                                : "Auto-Sync with AI"}
                            </Button>
                            <Button
                              variant="outline"
                              color="red"
                              size="sm"
                              onClick={handleResetSync}
                              fullWidth
                            >
                              Reset All Timestamps
                            </Button>
                          </Stack>
                        </Stack>
                      </div>

                      {/* Main Sync Button */}
                      <Button
                        size="xl"
                        color="pink"
                        variant="gradient"
                        gradient={{ from: "pink", to: "grape" }}
                        disabled={currentSyncIndex >= syncLines.length}
                        onClick={handleTapSync}
                        className="w-full h-24 text-lg font-bold"
                      >
                        {currentSyncIndex < syncLines.length ? (
                          <div className="flex flex-col items-center">
                            <span>Tap to Sync Highlighted Line</span>
                            <span className="text-xs font-normal opacity-80 mt-1">
                              &quot;{syncLines[currentSyncIndex].text}&quot;
                            </span>
                          </div>
                        ) : (
                          "All Lines Synced!"
                        )}
                      </Button>

                      {/* Lines view */}
                      <ScrollArea h={300} offsetScrollbars>
                        <Stack gap="xs" pr="md">
                          {syncLines.map((line, idx) => {
                            const isCurrent = idx === currentSyncIndex;
                            const hasTime = line.time !== undefined;
                            return (
                              <div
                                key={idx}
                                className={`flex items-center justify-between p-2 rounded transition-all border ${
                                  isCurrent
                                    ? "bg-pink-50 dark:bg-pink-950/20 border-pink-300 dark:border-pink-800 scale-[1.01] shadow-sm"
                                    : hasTime
                                      ? "bg-gray-50/50 dark:bg-dark-600/30 border-transparent text-gray-400 dark:text-gray-500"
                                      : "bg-transparent border-gray-100 dark:border-dark-600"
                                }`}
                              >
                                <div className="flex items-center gap-2 overflow-hidden mr-4">
                                  <div
                                    className={`flex items-center justify-center rounded-full text-[10px] font-bold shrink-0 w-5 h-5 ${
                                      isCurrent
                                        ? "bg-pink-500 text-white"
                                        : hasTime
                                          ? "bg-gray-200 dark:bg-dark-500 text-gray-600 dark:text-gray-300"
                                          : "bg-gray-100 dark:bg-dark-700 text-gray-400"
                                    }`}
                                  >
                                    {idx + 1}
                                  </div>
                                  <Text
                                    size="sm"
                                    lineClamp={1}
                                    fw={isCurrent ? 600 : 400}
                                  >
                                    {line.text}
                                  </Text>
                                </div>
                                <Group
                                  gap="xs"
                                  wrap="nowrap"
                                  style={{ flexShrink: 0 }}
                                >
                                  {hasTime ? (
                                    <>
                                      <Badge
                                        color="pink"
                                        variant="light"
                                        size="sm"
                                      >
                                        {formatTime(line.time!)}
                                      </Badge>
                                      <ActionIcon
                                        size="xs"
                                        variant="subtle"
                                        color="gray"
                                        onClick={() =>
                                          handleAdjustLineTime(idx, "backward")
                                        }
                                      >
                                        -
                                      </ActionIcon>
                                      <ActionIcon
                                        size="xs"
                                        variant="subtle"
                                        color="gray"
                                        onClick={() =>
                                          handleAdjustLineTime(idx, "forward")
                                        }
                                      >
                                        +
                                      </ActionIcon>
                                    </>
                                  ) : (
                                    <Text size="xs" c="dimmed">
                                      Waiting...
                                    </Text>
                                  )}
                                </Group>
                              </div>
                            );
                          })}
                        </Stack>
                      </ScrollArea>
                    </Stack>
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, md: 4 }}>
                    <Card
                      withBorder
                      h="100%"
                      className="bg-gray-50/50 dark:bg-dark-600/10"
                    >
                      <Title order={5} mb="sm" size="h5" fw={600}>
                        Sync Status
                      </Title>
                      <Divider mb="sm" />
                      <Stack gap="xs">
                        <Text size="xs">
                          Lines Synced:{" "}
                          <span className="font-semibold text-pink-500 font-mono">
                            <AnimatedCounter
                              value={
                                syncLines.filter((l) => l.time !== undefined)
                                  .length
                              }
                            />{" "}
                            / {syncLines.length}
                          </span>
                        </Text>
                        <Text size="xs">
                          Remaining:{" "}
                          <span className="font-semibold font-mono">
                            <AnimatedCounter
                              value={
                                syncLines.length -
                                syncLines.filter((l) => l.time !== undefined)
                                  .length
                              }
                            />
                          </span>
                        </Text>
                        <Progress
                          value={
                            syncLines.length > 0
                              ? (syncLines.filter((l) => l.time !== undefined)
                                  .length /
                                  syncLines.length) *
                                100
                              : 0
                          }
                          color="pink"
                          size="xs"
                          radius="xl"
                          animated
                          mt="xs"
                        />
                        <Text size="xs" c="dimmed" mt="xs">
                          Tip: Use spacebar to play/pause the audio. Adjust
                          timestamps dynamically if they are slightly off using
                          the + / - buttons next to each line.
                        </Text>
                      </Stack>
                    </Card>
                  </Grid.Col>
                </Grid>
              </Tabs.Panel>

              <Tabs.Panel value="preview" pt="md">
                <Card
                  withBorder
                  className="bg-dark-900 text-white min-h-[380px] flex flex-col items-center justify-center p-6 text-center relative overflow-hidden"
                  style={{ minHeight: "380px" }}
                >
                  <div className="absolute top-3 left-3 z-10">
                    <Badge color="pink" variant="filled">
                      LRC Live Preview
                    </Badge>
                  </div>

                  <ScrollArea
                    h={340}
                    viewportRef={previewViewportRef}
                    className="w-full"
                    style={{
                      maskImage:
                        "linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)",
                      WebkitMaskImage:
                        "linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)",
                    }}
                  >
                    <Stack gap="md" align="center" py="xl">
                      {syncedLyrics.length === 0 ? (
                        <Text c="dimmed" fs="italic">
                          No synchronized lyrics found.
                        </Text>
                      ) : (
                        syncedLyrics.map((lyric, idx) => {
                          const distance =
                            activeLyricIndex === -1
                              ? -1
                              : Math.abs(idx - activeLyricIndex);

                          let dynamicClasses = "";
                          let fontWeight = 500;

                          if (distance === -1) {
                            // Default / no playback
                            dynamicClasses =
                              "text-white/70 opacity-60 scale-100 blur-none";
                            fontWeight = 500;
                          } else if (distance === 0) {
                            // Spotify Highlight: 100% visible, bright pink glow
                            dynamicClasses =
                              "text-pink-400 opacity-100 scale-105 blur-none drop-shadow-[0_0_14px_rgba(244,114,182,0.5)]";
                            fontWeight = 700;
                          } else if (distance === 1) {
                            // Dekat highlight: transparansi sedikit menghilang (~65% opacity)
                            dynamicClasses =
                              "text-white/80 opacity-65 scale-100 blur-none";
                            fontWeight = 600;
                          } else if (distance === 2) {
                            // Transisi sedang: ~30% opacity, minimal blur
                            dynamicClasses =
                              "text-white/50 opacity-30 scale-[0.98] blur-[1px]";
                            fontWeight = 500;
                          } else {
                            // 100% keluar / jauh: 90% hilang (10% opacity) & agak blur
                            dynamicClasses =
                              "text-white/40 opacity-10 scale-[0.95] blur-[2px]";
                            fontWeight = 400;
                          }

                          return (
                            <Text
                              key={idx}
                              data-lyric-index={idx}
                              fw={fontWeight}
                              size="md"
                              className={`transition-all duration-700 ease-out transform-gpu will-change-transform w-full max-w-full px-4 sm:px-6 text-center select-none py-1.5 leading-relaxed tracking-wide ${dynamicClasses}`}
                            >
                              {lyric.text}
                            </Text>
                          );
                        })
                      )}
                    </Stack>
                  </ScrollArea>
                </Card>
              </Tabs.Panel>
            </Tabs>

            <Divider my="md" />

            {/* Embed & Download Actions */}
            <Stack gap="md">
              {embedError && (
                <Alert
                  icon={<AlertCircle size={16} />}
                  title="Embedding Failed"
                  color="red"
                  variant="light"
                >
                  {embedError}
                </Alert>
              )}

              {embedProgress === "success" && downloadUrl && (
                <Alert
                  icon={<CheckCircle size={16} />}
                  title="Lyrics Embedded Successfully!"
                  color="green"
                  variant="light"
                >
                  Your audio tags are updated. You can now download the file or
                  listen to check.
                </Alert>
              )}

              <Group justify="center" gap="md">
                <Button
                  size="lg"
                  color="pink"
                  onClick={handleEmbedLyrics}
                  loading={embedProgress === "embedding"}
                  disabled={!audioFile || !lyricsText.trim()}
                  className="px-8"
                >
                  Embed Lyrics to Audio
                </Button>

                {downloadUrl && (
                  <Button
                    component="a"
                    href={downloadUrl}
                    download={getDownloadName()}
                    size="lg"
                    color="teal"
                    leftSection={<Download size={18} />}
                    className="px-8 animate-bounce"
                  >
                    Download Synced MP3
                  </Button>
                )}
              </Group>
            </Stack>
          </Stack>
        </Collapse>
      </Stack>
    </Card>
  );
}
