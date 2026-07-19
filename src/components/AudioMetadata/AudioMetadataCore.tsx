"use client";

import { useState } from "react";
import { Button, Card, Group, Stack, Text, FileButton, Grid, Badge, Image as MantineImage } from "@mantine/core";
import { FileAudio, Upload } from "lucide-react";
// @ts-ignore
const jsmediatags = typeof window !== "undefined" ? require("jsmediatags/dist/jsmediatags.min.js") : null;
import { AIInsightPanel } from "@/components/AIInsightPanel/AIInsightPanel";

interface AudioMetadata {
  title?: string;
  artist?: string;
  album?: string;
  year?: string;
  genre?: string;
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

  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const handleGenerateInsight = async () => {
    if (!metadata) return;
    
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/summarize-meta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metadata, fileName, fileSize }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAiInsight(data.insight);
    } catch (err: any) {
      console.error(err);
      setAiInsight("Failed to generate AI insight.");
    } finally {
      setAiLoading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleFileUpload = (file: File | null) => {
    if (!file) return;
    
    setFileName(file.name);
    setFileSize(formatSize(file.size));
    setLoading(true);
    setError(null);
    setMetadata(null);

    jsmediatags.read(file, {
      onSuccess: function(tag: any) {
        setMetadata(tag.tags);
        setLoading(false);
      },
      onError: function(error: any) {
        console.error("Error reading tags:", error);
        setError("Failed to read audio metadata. File might not contain ID3 tags.");
        setLoading(false);
      }
    });
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
        <Group justify="space-between" align="center">
          <Group gap="sm">
            <FileAudio size={24} className="text-orange-500" />
            <Text fw={600} size="lg">Audio Metadata Extractor</Text>
          </Group>
          <FileButton onChange={handleFileUpload} accept="audio/*">
            {(props) => (
              <Button {...props} leftSection={<Upload size={16} />} variant="light" color="orange" loading={loading}>
                Select Audio File
              </Button>
            )}
          </FileButton>
        </Group>

        {error && (
          <Text c="red" size="sm" p="sm" className="bg-red-50 dark:bg-red-900/20 rounded-md">
            {error}
          </Text>
        )}

        {!metadata && !loading && !error && (
          <div className="py-12 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 dark:border-dark-400 rounded-lg">
            <FileAudio size={48} className="mb-4 opacity-50" />
            <Text>No file selected</Text>
            <Text size="sm">Upload an MP3 or audio file to extract its ID3 tags</Text>
          </div>
        )}

        {metadata && (
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
                    
                    <Grid.Col span={4}><Text size="sm" c="dimmed">Title:</Text></Grid.Col>
                    <Grid.Col span={8}><Text size="sm" fw={500}>{metadata.title || "—"}</Text></Grid.Col>
                    
                    <Grid.Col span={4}><Text size="sm" c="dimmed">Artist:</Text></Grid.Col>
                    <Grid.Col span={8}><Text size="sm" fw={500}>{metadata.artist || "—"}</Text></Grid.Col>
                    
                    <Grid.Col span={4}><Text size="sm" c="dimmed">Album:</Text></Grid.Col>
                    <Grid.Col span={8}><Text size="sm" fw={500}>{metadata.album || "—"}</Text></Grid.Col>
                    
                    <Grid.Col span={4}><Text size="sm" c="dimmed">Year:</Text></Grid.Col>
                    <Grid.Col span={8}><Text size="sm" fw={500}>{metadata.year || "—"}</Text></Grid.Col>
                    
                    <Grid.Col span={4}><Text size="sm" c="dimmed">Genre:</Text></Grid.Col>
                    <Grid.Col span={8}>
                      {metadata.genre ? <Badge color="orange" variant="light">{metadata.genre}</Badge> : "—"}
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
              color="orange"
            />
          </>
        )}
      </Stack>
    </Card>
  );
}
