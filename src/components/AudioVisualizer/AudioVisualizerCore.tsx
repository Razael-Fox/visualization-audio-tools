"use client";

import { useEffect, useRef, useState } from "react";
import WaveSurfer from "wavesurfer.js";
import { Button, Card, Group, Stack, Text, FileButton, ActionIcon, Slider } from "@mantine/core";
import { Play, Pause, Square, Upload, Sparkles } from "lucide-react";
import { AIInsightPanel } from "@/components/AIInsightPanel/AIInsightPanel";

export function AudioVisualizerCore() {
  const containerRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [audioFileName, setAudioFileName] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const handleGenerateInsight = async () => {
    if (!file) return;
    
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
    } catch (err: any) {
      console.error(err);
      setAiInsight("Failed to analyze audio using AI.");
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;

    wavesurfer.current = WaveSurfer.create({
      container: containerRef.current,
      waveColor: "violet",
      progressColor: "purple",
      cursorColor: "navy",
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height: 150,
      normalize: true,
    });

    wavesurfer.current.on("play", () => setIsPlaying(true));
    wavesurfer.current.on("pause", () => setIsPlaying(false));
    wavesurfer.current.on("finish", () => setIsPlaying(false));

    return () => {
      wavesurfer.current?.destroy();
    };
  }, []);

  const handleFileUpload = (selectedFile: File | null) => {
    if (!selectedFile || !wavesurfer.current) return;
    setFile(selectedFile);
    setAudioFileName(selectedFile.name);
    setAiInsight(null);
    
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
        <Group justify="space-between" align="center">
          <Text fw={600} size="lg">Audio Waveform</Text>
          <FileButton onChange={handleFileUpload} accept="audio/*">
            {(props) => (
              <Button {...props} leftSection={<Upload size={16} />} variant="light">
                Upload Audio
              </Button>
            )}
          </FileButton>
        </Group>

        {audioFileName && (
          <Text size="sm" c="dimmed">
            Loaded: <span className="font-medium text-gray-700 dark:text-gray-300">{audioFileName}</span>
          </Text>
        )}

        <div 
          ref={containerRef} 
          className="w-full bg-gray-50 dark:bg-dark-700 rounded-md border border-gray-200 dark:border-dark-500 min-h-[150px]"
        />

        <Group justify="space-between">
          <Group gap="sm">
            <ActionIcon 
              size="xl" 
              variant="filled" 
              color="blue" 
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

          <Group gap="xs" style={{ width: 150 }}>
            <Text size="sm">Vol</Text>
            <Slider 
              value={volume} 
              onChange={handleVolumeChange} 
              min={0} 
              max={1} 
              step={0.01} 
              className="flex-1"
            />
          </Group>
        </Group>

        {audioFileName && (
          <AIInsightPanel 
            title="Smart Waveform Insight" 
            description="Let AI analyze the audio characteristics, structure, and quality."
            insightResult={aiInsight}
            loading={aiLoading}
            onGenerate={handleGenerateInsight}
            color="violet"
          />
        )}
      </Stack>
    </Card>
  );
}
