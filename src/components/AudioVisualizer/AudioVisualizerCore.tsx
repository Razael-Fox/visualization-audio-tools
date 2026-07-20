"use client";

import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import {
  Button,
  Card,
  Group,
  Stack,
  Text,
  FileButton,
  ActionIcon,
  Slider,
  Alert,
  Collapse,
  Skeleton,
  useMantineTheme,
  useComputedColorScheme,
} from "@mantine/core";
import {
  Play,
  Pause,
  Square,
  Upload,
  AlertCircle,
  Activity,
} from "lucide-react";
import { AIInsightPanel } from "@/components/AIInsightPanel/AIInsightPanel";
import { useUsageLimit } from "@/hooks/useUsageLimit";

export function AudioVisualizerCore() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const requestRef = useRef<number>(0);

  const theme = useMantineTheme();
  const colorScheme = useComputedColorScheme("dark");
  const waveColor =
    colorScheme === "dark" ? theme.colors.violet[8] : theme.colors.violet[2];
  const progressColor =
    colorScheme === "dark" ? theme.colors.violet[4] : theme.colors.violet[6];
  const cursorColor =
    colorScheme === "dark" ? theme.colors.violet[2] : theme.colors.violet[8];

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [audioFileName, setAudioFileName] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [limitError, setLimitError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const {
    canUpload,
    canGenerateAi,
    incrementUpload,
    incrementAi,
    checkDuration,
  } = useUsageLimit();

  const handleGenerateInsight = async () => {
    if (!file) return;
    setLimitError(null);

    if (!canGenerateAi) {
      setLimitError(
        "You have reached the AI generation limit for this session.",
      );
      return;
    }

    await incrementAi();

    setAiLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/ai/analyze-audio", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAiInsight(data.insight);
    } catch (err: unknown) {
      console.error(err);
      setAiInsight("Failed to analyze audio using AI.");
    } finally {
      setAiLoading(false);
    }
  };

  const formatTime = (time: number) => {
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec < 10 ? "0" : ""}${sec}`;
  };

  useEffect(() => {
    if (wavesurfer.current) {
      wavesurfer.current.setOptions({
        waveColor,
        progressColor,
        cursorColor,
      });
    }
  }, [waveColor, progressColor, cursorColor]);

  useEffect(() => {
    if (!containerRef.current) return;

    wavesurfer.current = WaveSurfer.create({
      container: containerRef.current,
      waveColor,
      progressColor,
      cursorColor,
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height: 150,
      normalize: true,
    });

    wavesurfer.current.on("ready", () => {
      setIsReady(true);
      setDuration(wavesurfer.current?.getDuration() || 0);

      if (!audioCtxRef.current) {
        try {
          const audioCtx = new (
            window.AudioContext || (window as any).webkitAudioContext
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
      drawSpectrum();
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
  }, []);

  const drawSpectrum = () => {
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

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
      gradient.addColorStop(0, "#4a90e2");
      gradient.addColorStop(1, "#ae4bec");

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 1.5;
        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    };

    draw();
  };

  const handleFileUpload = async (selectedFile: File | null) => {
    if (!selectedFile || !wavesurfer.current) return;
    setLimitError(null);

    if (!canUpload) {
      setLimitError(
        "You have reached the maximum upload limit for this session.",
      );
      return;
    }

    const isValidDuration = await checkDuration(selectedFile);
    if (!isValidDuration) {
      setLimitError("Audio file exceeds the 10-minute duration limit.");
      return;
    }

    await incrementUpload();

    setFile(selectedFile);
    setAudioFileName(selectedFile.name);
    setAiInsight(null);
    setIsReady(false);
    setCurrentTime(0);
    setDuration(0);

    const url = URL.createObjectURL(selectedFile);
    wavesurfer.current.load(url);
  };

  const togglePlay = () => {
    wavesurfer.current?.playPause();
  };

  const stopAudio = () => {
    wavesurfer.current?.stop();
    setIsPlaying(false);
  };

  const handleVolumeChange = (value: number) => {
    setVolume(value);
    wavesurfer.current?.setVolume(value);
  };

  return (
    <Card withBorder shadow="sm" radius="md" p="xl" className="w-full">
      <Stack gap="lg">
        {limitError && (
          <Alert
            icon={<AlertCircle size={16} />}
            title="Usage Limit Reached"
            color="red"
            variant="light"
            withCloseButton
            onClose={() => setLimitError(null)}
          >
            {limitError} Please{" "}
            <a
              href="https://www.razael-fox.my.id/go/discord"
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              Join our Discord
            </a>{" "}
            for more info.
          </Alert>
        )}
        <Group justify="space-between" align="flex-start">
          <Group gap="sm" align="center">
            <Activity size={28} className="text-blue-500" />
            <div>
              <Text fw={700} size="xl">
                Audio Visualizer
              </Text>
              <Text size="sm" c="dimmed">
                Visualize audio frequencies in real-time
              </Text>
            </div>
          </Group>
          <FileButton onChange={handleFileUpload} accept="audio/*">
            {(props) => (
              <Button
                {...props}
                leftSection={<Upload size={16} />}
                variant="light"
                color="visualizer"
              >
                Upload Audio
              </Button>
            )}
          </FileButton>
        </Group>

        <Collapse expanded={!!audioFileName}>
          <Stack gap="md" mt="md">
            <Text size="sm" c="dimmed">
              Loaded:{" "}
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {audioFileName}
              </span>
            </Text>

            <div className="relative w-full rounded-md border border-gray-200 dark:border-dark-500 overflow-hidden bg-gray-50 dark:bg-dark-700">
              {!isReady && <Skeleton height={150} radius="md" animate />}

              <canvas
                ref={canvasRef}
                width={800}
                height={150}
                className={`absolute inset-0 w-full h-full opacity-40 pointer-events-none transition-opacity duration-300 ${!isReady ? "hidden" : ""}`}
                style={{ zIndex: 0 }}
              />

              <div
                ref={containerRef}
                className={`w-full min-h-[150px] relative z-10 ${!isReady ? "hidden" : ""}`}
              />
            </div>

            {isReady && (
              <Group justify="space-between" mt="-xs">
                <Text size="xs" c="dimmed" fw={500}>
                  {formatTime(currentTime)}
                </Text>
                <Text size="xs" c="dimmed" fw={500}>
                  {formatTime(duration)}
                </Text>
              </Group>
            )}

            <Group
              mt="sm"
              align="center"
              style={{ gap: "1rem", flexWrap: "wrap" }}
            >
              <Group gap="sm">
                <ActionIcon
                  size="xl"
                  variant="filled"
                  color="visualizer"
                  onClick={togglePlay}
                  disabled={!audioFileName}
                >
                  {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                </ActionIcon>
                <ActionIcon
                  size="xl"
                  variant="light"
                  color="red"
                  onClick={stopAudio}
                  disabled={!audioFileName}
                >
                  <Square size={20} />
                </ActionIcon>
              </Group>

              <Group
                gap="md"
                wrap="nowrap"
                style={{ flex: 1, minWidth: "200px" }}
              >
                <Text size="sm" fw={500}>
                  Volume
                </Text>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={volume}
                  onChange={(e) =>
                    handleVolumeChange(parseFloat(e.target.value))
                  }
                  className="flex-1 h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-violet-500"
                  style={{ minWidth: "150px" }}
                />
              </Group>
            </Group>

            <AIInsightPanel
              title="Acoustic Analysis Insights"
              description="Get AI-powered analysis of the audio characteristics, waveform patterns, and structural insights."
              insightResult={aiInsight}
              loading={aiLoading}
              onGenerate={handleGenerateInsight}
              color="visualizer"
            />
          </Stack>
        </Collapse>
      </Stack>
    </Card>
  );
}
