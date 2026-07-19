"use client";

import { useState } from "react";
import { Button, Card, Group, Stack, Text, FileButton, Grid, Badge, Image as MantineImage, Alert, Collapse, Skeleton } from "@mantine/core";
import { FileAudio, Upload, AlertCircle } from "lucide-react";
import { parseBlob } from 'music-metadata';
import { AIInsightPanel } from "@/components/AIInsightPanel/AIInsightPanel";
import { useUsageLimit } from "@/hooks/useUsageLimit";

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

export function AudioMetadataCore() {
  const [metadata, setMetadata] = useState<AudioMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);
  const [loadProgress, setLoadProgress] = useState(0);

  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [limitError, setLimitError] = useState<string | null>(null);
  
  const { canUpload, canGenerateAi, incrementUpload, incrementAi, checkDuration } = useUsageLimit();

  const handleGenerateInsight = async () => {
    if (!metadata) return;
    setLimitError(null);
    
    if (!canGenerateAi) {
      setLimitError("You have reached the AI generation limit for this session.");
      return;
    }
    
    await incrementAi();
    
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/summarize-meta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metadata, fileName, fileSize, fileType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAiInsight(data.insight);
    } catch (err) {
      console.error(err);
      setAiInsight("Failed to generate AI insight.");
    } finally {
      setAiLoading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 MB";
    const mb = bytes / (1024 * 1024);
    return mb.toFixed(2) + " MB";
  };

  const handleFileUpload = async (file: File | null) => {
    if (!file) return;
    setLimitError(null);
    
    if (!canUpload) {
      setLimitError("You have reached the maximum upload limit for this session.");
      return;
    }
    
    const isValidDuration = await checkDuration(file);
    if (!isValidDuration) {
      setLimitError("Audio file exceeds the 10-minute duration limit.");
      return;
    }

    await incrementUpload();
    
    setFileName(file.name);
    setFileSize(formatSize(file.size));
    setFileType(file.type || "audio/unknown");
    setLoading(true);
    setLoadProgress(0);
    setError(null);
    setMetadata(null);

    // Simulate real-time progress during parsing
    const progressInterval = setInterval(() => {
      setLoadProgress((prev) => {
        if (prev >= 90) return prev;
        // Random increment between 5 and 15
        return prev + Math.floor(Math.random() * 10) + 5;
      });
    }, 50);

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
        picture: common.picture && common.picture.length > 0 
          ? {
              format: common.picture[0].format,
              data: Array.from(common.picture[0].data)
            }
          : undefined
      });
      
      setLoadProgress(100);
      setTimeout(() => {
        setLoading(false);
        setLoadProgress(0);
      }, 400); // brief pause at 100% before resetting
    } catch (err) {
      console.error("Error reading tags:", err);
      setError("Failed to read audio metadata. File might not contain supported tags.");
      setLoading(false);
      setLoadProgress(0);
    } finally {
      clearInterval(progressInterval);
    }
  };

  // Create Object URL for image data
  let coverArtUrl = "";
  if (metadata?.picture) {
    const { data, format } = metadata.picture;
    const base64String = data.reduce((acc, curr) => acc + String.fromCharCode(curr), "");
    coverArtUrl = `data:${format};base64,${btoa(base64String)}`;
  }

  return (
    <Card withBorder shadow="sm" radius="md" p="xl" className="w-full">
      <Stack gap="lg">
        {limitError && (
          <Alert icon={<AlertCircle size={16} />} title="Usage Limit Reached" color="red" variant="light" withCloseButton onClose={() => setLimitError(null)}>
            {limitError} Please <a href="https://www.razael-fox.my.id/go/discord" target="_blank" rel="noreferrer" className="underline">Join our Discord</a> for more info.
          </Alert>
        )}
        <Group justify="space-between" align="flex-start">
          <Group gap="sm" align="center">
            <FileAudio size={28} className="text-orange-500" />
            <div>
              <Text fw={700} size="xl">Audio Metadata Extractor</Text>
              <Text size="sm" c="dimmed">Extract and view ID3 tags from your audio files</Text>
            </div>
          </Group>
          <FileButton onChange={handleFileUpload} accept="audio/*">
            {(props) => (
              <Button 
                {...props} 
                leftSection={!loading && <Upload size={16} />} 
                variant={loading ? "filled" : "light"} 
                color={loading ? "dark" : "metadata"}
                disabled={loading}
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'background-color 0.3s ease'
                }}
              >
                {loading && (
                  <div 
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      height: '100%',
                      width: `${loadProgress}%`,
                      backgroundColor: 'var(--mantine-color-metadata-filled)',
                      transition: 'width 0.1s ease-out',
                      zIndex: 0
                    }}
                  />
                )}
                <span style={{ position: 'relative', zIndex: 1 }}>
                  {loading ? `Processing... ${loadProgress}%` : 'Select Audio File'}
                </span>
              </Button>
            )}
          </FileButton>
        </Group>

        {error && (
          <Text c="red" size="sm" p="sm" className="bg-red-50 dark:bg-red-900/20 rounded-md">
            {error}
          </Text>
        )}

        <Collapse expanded={!!metadata || loading}>
          {loading ? (
            <Grid mt="md" gap="xl">
              <Grid.Col span={{ base: 12, md: 4 }}>
                <Skeleton height={250} radius="md" animate />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 8 }}>
                <Stack gap="sm">
                  <Skeleton height={30} width="60%" radius="sm" animate mb="sm" />
                  {[...Array(6)].map((_, i) => (
                    <Group key={i} grow>
                      <Skeleton height={20} radius="sm" animate />
                      <Skeleton height={20} radius="sm" animate />
                    </Group>
                  ))}
                </Stack>
              </Grid.Col>
            </Grid>
          ) : metadata ? (
            <>
              <Grid mt="md" gap="xl">
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <div className="flex flex-col items-center p-4 bg-gray-50 dark:bg-dark-600 rounded-lg border border-gray-100 dark:border-dark-500">
                    {coverArtUrl ? (
                      <MantineImage 
                        src={coverArtUrl} 
                        alt="Album Art" 
                        className="w-full aspect-square object-cover rounded-md shadow-sm mb-4"
                      />
                    ) : (
                      <div className="w-full aspect-square bg-gray-200 dark:bg-dark-400 rounded-md flex items-center justify-center mb-4">
                        <FileAudio size={64} className="text-gray-400" />
                      </div>
                    )}
                    
                    <Text fw={600} ta="center" lineClamp={2}>
                      {metadata.title || fileName}
                    </Text>
                    <Text size="sm" c="dimmed" ta="center">
                      {metadata.artist || "Unknown Artist"}
                    </Text>
                  </div>
                </Grid.Col>
                
                <Grid.Col span={{ base: 12, md: 8 }}>
                  <Stack gap="md">
                    <Text fw={600} size="lg" className="border-b border-gray-200 dark:border-dark-500 pb-2">
                      ID3 Tags & Information
                    </Text>
                    
                    <Grid>
                      <Grid.Col span={4}><Text size="sm" c="dimmed">File Name:</Text></Grid.Col>
                      <Grid.Col span={8}><Text size="sm" fw={500}>{fileName}</Text></Grid.Col>
                      
                      <Grid.Col span={4}><Text size="sm" c="dimmed">File Size:</Text></Grid.Col>
                      <Grid.Col span={8}><Text size="sm" fw={500}>{fileSize}</Text></Grid.Col>
                      
                      <Grid.Col span={4}><Text size="sm" c="dimmed">File Type:</Text></Grid.Col>
                      <Grid.Col span={8}><Badge color="gray" variant="light">{fileType}</Badge></Grid.Col>
                      
                      <Grid.Col span={4}><Text size="sm" c="dimmed">Title:</Text></Grid.Col>
                      <Grid.Col span={8}><Text size="sm" fw={500}>{metadata.title || "—"}</Text></Grid.Col>
                      
                      <Grid.Col span={4}><Text size="sm" c="dimmed">Artist:</Text></Grid.Col>
                      <Grid.Col span={8}><Text size="sm" fw={500}>{metadata.artist || "—"}</Text></Grid.Col>
                      
                      <Grid.Col span={4}><Text size="sm" c="dimmed">Album:</Text></Grid.Col>
                      <Grid.Col span={8}><Text size="sm" fw={500}>{metadata.album || "—"}</Text></Grid.Col>
                      
                      <Grid.Col span={4}><Text size="sm" c="dimmed">Year:</Text></Grid.Col>
                      <Grid.Col span={8}><Text size="sm" fw={500}>{metadata.year || "—"}</Text></Grid.Col>

                      <Grid.Col span={4}><Text size="sm" c="dimmed">Track:</Text></Grid.Col>
                      <Grid.Col span={8}><Text size="sm" fw={500}>{metadata.track || "—"}</Text></Grid.Col>
                      
                      <Grid.Col span={4}><Text size="sm" c="dimmed">Genre:</Text></Grid.Col>
                      <Grid.Col span={8}>
                        {metadata.genre ? <Badge color="metadata" variant="light">{metadata.genre}</Badge> : "—"}
                      </Grid.Col>
                    </Grid>
                  </Stack>
                </Grid.Col>
              </Grid>

              <AIInsightPanel 
                title="Smart Metadata Insights" 
                description="Get AI-powered narrative summary and optimization tips for this audio."
                insightResult={aiInsight}
                loading={aiLoading}
                onGenerate={handleGenerateInsight}
                color="metadata"
              />
            </>
          ) : null}
        </Collapse>
      </Stack>
    </Card>
  );
}
