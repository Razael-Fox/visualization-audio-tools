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
  SegmentedControl,
  Select,
  Switch,
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

interface ThemeColors {
  color1: string;
  color2: string;
  accent: string;
  linearGrad: CanvasGradient;
  radialGrad: CanvasGradient;
}

const getThemeColors = (
  themeName: string,
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  cx: number,
  cy: number,
  radius: number
): ThemeColors => {
  let color1 = "#7c3aed";
  let color2 = "#c084fc";
  let accent = "#c084fc";

  switch (themeName) {
    case "cyberpunk":
      color1 = "#06b6d4"; // cyan
      color2 = "#ec4899"; // pink
      accent = "#ec4899"; // pink
      break;
    case "sunset":
      color1 = "#ea580c"; // orange
      color2 = "#eab308"; // yellow
      accent = "#eab308"; // yellow
      break;
    case "ocean":
      color1 = "#0284c7"; // sky
      color2 = "#14b8a6"; // teal
      accent = "#14b8a6"; // teal
      break;
    case "matrix":
      color1 = "#16a34a"; // green-600
      color2 = "#22c55e"; // green-500
      accent = "#22c55e"; // green-500
      break;
    case "violet":
    default:
      color1 = "#7c3aed"; // violet
      color2 = "#c084fc"; // purple
      accent = "#c084fc"; // purple
      break;
  }

  const linearGrad = ctx.createLinearGradient(0, height, 0, 0);
  linearGrad.addColorStop(0, color1);
  linearGrad.addColorStop(1, color2);

  const radialGrad = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius);
  radialGrad.addColorStop(0, `${color1}33`);
  radialGrad.addColorStop(1, `${color2}aa`);

  return { color1, color2, accent, linearGrad, radialGrad };
};

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

  const [visualizerType, setVisualizerType] = useState<"bar" | "circle-gravity">("bar");
  const [visualizerTheme, setVisualizerTheme] = useState<string>("violet");
  const [showParticles, setShowParticles] = useState<boolean>(true);
  const [sensitivity, setSensitivity] = useState<number>(1.2);

  const visualizerTypeRef = useRef(visualizerType);
  const visualizerThemeRef = useRef(visualizerTheme);
  const showParticlesRef = useRef(showParticles);
  const sensitivityRef = useRef(sensitivity);

  useEffect(() => {
    visualizerTypeRef.current = visualizerType;
  }, [visualizerType]);

  useEffect(() => {
    visualizerThemeRef.current = visualizerTheme;
  }, [visualizerTheme]);

  useEffect(() => {
    showParticlesRef.current = showParticles;
  }, [showParticles]);

  useEffect(() => {
    sensitivityRef.current = sensitivity;
  }, [sensitivity]);

  useEffect(() => {
    if (!isPlaying && canvasRef.current && isReady) {
      const canvas = canvasRef.current;
      
      // Dynamic resize to prevent stretching/squishing
      canvas.width = canvas.clientWidth || 800;
      canvas.height = canvas.clientHeight || 250;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#090d16";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        if (visualizerType === "circle-gravity") {
          const cx = canvas.width / 2;
          const cy = canvas.height / 2;
          const colors = getThemeColors(visualizerTheme, ctx, canvas.width, canvas.height, cx, cy, 45);
          
          ctx.save();
          ctx.shadowBlur = 15;
          ctx.shadowColor = colors.accent;
          ctx.fillStyle = "#0c101d";
          ctx.strokeStyle = colors.color2;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(cx, cy, 45, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
      }
    }
  }, [visualizerType, visualizerTheme, isPlaying, isReady]);

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
      height: 60,
      normalize: true,
    });

    wavesurfer.current.on("ready", () => {
      setIsReady(true);
      setDuration(wavesurfer.current?.getDuration() || 0);

      // Pre-render idle state on canvas
      setTimeout(() => {
        if (canvasRef.current) {
          const canvas = canvasRef.current;
          
          // Dynamic resize to prevent stretching/squishing
          canvas.width = canvas.clientWidth || 800;
          canvas.height = canvas.clientHeight || 250;

          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.fillStyle = "#090d16";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            if (visualizerTypeRef.current === "circle-gravity") {
              const cx = canvas.width / 2;
              const cy = canvas.height / 2;
              const colors = getThemeColors(visualizerThemeRef.current, ctx, canvas.width, canvas.height, cx, cy, 45);
              
              ctx.save();
              ctx.shadowBlur = 15;
              ctx.shadowColor = colors.accent;
              ctx.fillStyle = "#0c101d";
              ctx.strokeStyle = colors.color2;
              ctx.lineWidth = 4;
              ctx.beginPath();
              ctx.arc(cx, cy, 45, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
              ctx.restore();
            }
          }
        }
      }, 50);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const drawSpectrum = () => {
    if (!analyserRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    interface Particle {
      x: number;
      y: number;
      angle: number;
      speed: number;
      size: number;
      alpha: number;
      color: string;
    }
    const particles: Particle[] = [];

    const draw = () => {
      requestRef.current = requestAnimationFrame(draw);
      
      // Dynamic resize to prevent stretching/squishing
      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
      }

      analyser.getByteFrequencyData(dataArray);

      // Clear background
      ctx.fillStyle = "#090d16";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;

      // Extract settings
      const type = visualizerTypeRef.current;
      const themeName = visualizerThemeRef.current;
      const sens = sensitivityRef.current;
      const particlesEnabled = showParticlesRef.current;

      // Get theme-specific colors
      const colors = getThemeColors(themeName, ctx, canvas.width, canvas.height, cx, cy, 60);

      if (type === "bar") {
        // Draw Bar Spectrum (Linear)
        const barWidth = (canvas.width / bufferLength) * 2.0;
        let barHeight;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          barHeight = (dataArray[i] / 255) * canvas.height * 0.8 * sens;
          ctx.fillStyle = colors.linearGrad;
          
          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(x, canvas.height - barHeight, barWidth - 1, barHeight, [2, 2, 0, 0]);
            ctx.fill();
          } else {
            ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
          }
          x += barWidth;
        }
      } else if (type === "circle-gravity") {
        // Draw NCS Gravity Circle
        let bassSum = 0;
        const bassBinCount = 8;
        for (let i = 0; i < bassBinCount; i++) {
          bassSum += dataArray[i];
        }
        const bassAverage = bassSum / bassBinCount;
        const bassNormalized = bassAverage / 255;
        const bassIntensity = bassNormalized * sens;

        const baseRadius = 45;
        const radius = baseRadius + (bassIntensity * 15);

        // Draw Floating Particles
        if (particlesEnabled) {
          if (particles.length === 0) {
            for (let i = 0; i < 60; i++) {
              const spawnAngle = Math.random() * Math.PI * 2;
              particles.push({
                x: cx + Math.cos(spawnAngle) * radius,
                y: cy + Math.sin(spawnAngle) * radius,
                angle: spawnAngle,
                speed: 0.5 + Math.random() * 1.5,
                size: 1 + Math.random() * 3,
                alpha: 0.2 + Math.random() * 0.8,
                color: colors.accent,
              });
            }
          }

          particles.forEach((p) => {
            const speed = p.speed * (1 + bassIntensity * 3.5);
            p.x += Math.cos(p.angle) * speed;
            p.y += Math.sin(p.angle) * speed;

            const dx = p.x - cx;
            const dy = p.y - cy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            const maxDist = Math.min(canvas.width, canvas.height);
            p.alpha = Math.max(0, 1 - (dist / (maxDist * 0.6)));

            if (dist > maxDist * 0.6 || p.alpha <= 0) {
              const spawnAngle = Math.random() * Math.PI * 2;
              p.x = cx + Math.cos(spawnAngle) * radius;
              p.y = cy + Math.sin(spawnAngle) * radius;
              p.angle = spawnAngle + (Math.random() - 0.5) * 0.3;
              p.alpha = 0.5 + Math.random() * 0.5;
              p.size = 1 + Math.random() * 3;
              p.speed = 0.5 + Math.random() * 1.5;
            }

            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = colors.accent;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          });
        }

        // Draw Radiating Symmetrical Bars
        const numBars = 120;
        ctx.save();
        ctx.lineWidth = 2.5;
        
        for (let i = 0; i < numBars; i++) {
          const angle = (i / numBars) * Math.PI * 2;
          const halfIndex = i < numBars / 2 ? i : numBars - 1 - i;
          const dataIndex = Math.floor((halfIndex / (numBars / 2)) * (bufferLength * 0.65));
          const value = dataArray[dataIndex] || 0;
          
          const barHeight = (value / 255) * 50 * sens;
          
          const startX = cx + Math.cos(angle) * radius;
          const startY = cy + Math.sin(angle) * radius;
          const endX = cx + Math.cos(angle) * (radius + barHeight);
          const endY = cy + Math.sin(angle) * (radius + barHeight);

          const barGrad = ctx.createLinearGradient(startX, startY, endX, endY);
          barGrad.addColorStop(0, colors.color1);
          barGrad.addColorStop(1, colors.color2);
          
          ctx.strokeStyle = barGrad;
          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.stroke();
        }
        ctx.restore();

        // Center Circle
        ctx.save();
        ctx.shadowBlur = 15;
        ctx.shadowColor = colors.accent;
        ctx.fillStyle = "#0c101d";
        ctx.strokeStyle = colors.color2;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        // 3D Inner radial gradient
        ctx.save();
        const innerRadius = radius * 0.85;
        const circleGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, innerRadius);
        circleGrad.addColorStop(0, "#111827");
        circleGrad.addColorStop(0.7, "#0f172a");
        circleGrad.addColorStop(1, `${colors.color1}44`);
        ctx.fillStyle = circleGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, innerRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Central pulse core
        ctx.save();
        ctx.fillStyle = colors.accent;
        ctx.globalAlpha = 0.15 + (bassIntensity * 0.4);
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 0.35 + (bassIntensity * 10), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
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

    if (canvasRef.current) {
      const canvas = canvasRef.current;
      
      // Dynamic resize to prevent stretching/squishing
      canvas.width = canvas.clientWidth || 800;
      canvas.height = canvas.clientHeight || 250;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#090d16";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        if (visualizerType === "circle-gravity") {
          const cx = canvas.width / 2;
          const cy = canvas.height / 2;
          const colors = getThemeColors(visualizerTheme, ctx, canvas.width, canvas.height, cx, cy, 45);
          
          ctx.save();
          ctx.shadowBlur = 15;
          ctx.shadowColor = colors.accent;
          ctx.fillStyle = "#0c101d";
          ctx.strokeStyle = colors.color2;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(cx, cy, 45, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
      }
    }
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

            <Stack gap="md">
              {/* Visualizer Display Panel */}
              <div className="relative w-full rounded-md border border-gray-200 dark:border-dark-500 overflow-hidden bg-[#090d16] flex items-center justify-center">
                {!isReady && <Skeleton height={250} radius="md" animate />}
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={250}
                  className={`w-full h-[250px] block transition-opacity duration-300 ${!isReady ? "hidden" : ""}`}
                />
              </div>

              {/* Seeker / Waveform Timeline */}
              <div className="relative w-full rounded-md border border-gray-200 dark:border-dark-500 overflow-hidden bg-gray-50 dark:bg-dark-700 p-2">
                {!isReady && <Skeleton height={60} radius="md" animate />}
                <div
                  ref={containerRef}
                  className={`w-full min-h-[60px] relative z-10 ${!isReady ? "hidden" : ""}`}
                />
              </div>
            </Stack>

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

            {/* Visualizer Settings Panel */}
            <Card withBorder radius="md" p="md" bg="var(--mantine-color-body)">
              <Stack gap="sm">
                <Text fw={600} size="sm">Visualizer Settings</Text>
                <Group grow align="flex-end" style={{ gap: "1rem" }}>
                  <Stack gap="xs">
                    <Text size="xs" fw={500}>Type</Text>
                    <SegmentedControl
                      value={visualizerType}
                      onChange={(value) => setVisualizerType(value as "bar" | "circle-gravity")}
                      data={[
                        { label: "Bar Spectrum", value: "bar" },
                        { label: "NCS Gravity Circle", value: "circle-gravity" },
                      ]}
                      size="xs"
                    />
                  </Stack>

                  <Stack gap="xs">
                    <Text size="xs" fw={500}>Theme</Text>
                    <Select
                      value={visualizerTheme}
                      onChange={(value) => setVisualizerTheme(value || "violet")}
                      data={[
                        { label: "Violet Neon", value: "violet" },
                        { label: "NCS Cyberpunk", value: "cyberpunk" },
                        { label: "Sunset Glow", value: "sunset" },
                        { label: "Ocean Wave", value: "ocean" },
                        { label: "Matrix Green", value: "matrix" },
                      ]}
                      size="xs"
                    />
                  </Stack>
                </Group>

                <Group gap="xl" mt="xs" align="center">
                  <Stack gap="xs" style={{ flex: 1 }}>
                    <Text size="xs" fw={500}>Sensitivity: {sensitivity}x</Text>
                    <Slider
                      min={0.5}
                      max={2.5}
                      step={0.1}
                      value={sensitivity}
                      onChange={setSensitivity}
                      size="sm"
                    />
                  </Stack>

                  {visualizerType === "circle-gravity" && (
                    <Switch
                      label="Show Particles"
                      checked={showParticles}
                      onChange={(event) => setShowParticles(event.currentTarget.checked)}
                      size="sm"
                      mt="md"
                    />
                  )}
                </Group>
              </Stack>
            </Card>

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
