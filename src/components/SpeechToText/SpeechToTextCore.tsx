"use client";

import { useState } from "react";
import { Button, Card, Group, Stack, Text, FileButton, Textarea, ActionIcon, CopyButton, Tooltip } from "@mantine/core";
import { Mic, Upload, Copy, Check, Download } from "lucide-react";
import { AIInsightPanel } from "@/components/AIInsightPanel/AIInsightPanel";

export function SpeechToTextCore() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [transcription, setTranscription] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const handleGenerateInsight = async () => {
    if (!transcription) return;
    
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/correct-stt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcription }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAiInsight(data.insight);
    } catch (err: any) {
      console.error(err);
      setAiInsight("Failed to generate AI correction.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleFileUpload = (selectedFile: File | null) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setError(null);
    setTranscription("");
  };

  const handleTranscribe = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/stt/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Transcription failed");
      }

      setTranscription(data.text);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred during transcription");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!transcription) return;
    const blob = new Blob([transcription], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transcription-${file?.name || "audio"}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card withBorder shadow="sm" radius="md" p="xl" className="w-full">
      <Stack gap="lg">
        <Group justify="space-between" align="center">
          <Group gap="sm">
            <Mic size={24} className="text-teal-500" />
            <Text fw={600} size="lg">Speech to Text</Text>
          </Group>
          <FileButton onChange={handleFileUpload} accept="audio/*">
            {(props) => (
              <Button {...props} leftSection={<Upload size={16} />} variant="light" color="teal">
                Select Audio
              </Button>
            )}
          </FileButton>
        </Group>

        {file && (
          <Group justify="space-between" p="sm" className="bg-gray-50 dark:bg-dark-600 rounded-md border border-gray-100 dark:border-dark-500">
            <Text size="sm" fw={500} truncate className="flex-1">
              {file.name}
            </Text>
            <Button 
              size="sm" 
              color="teal" 
              onClick={handleTranscribe} 
              loading={loading}
            >
              Transcribe Now
            </Button>
          </Group>
        )}

        {error && (
          <Text c="red" size="sm" p="sm" className="bg-red-50 dark:bg-red-900/20 rounded-md">
            {error}
          </Text>
        )}

        {(transcription || loading) && (
          <Stack gap="sm">
            <Group justify="space-between" align="center">
              <Text fw={500} size="sm" c="dimmed">Result:</Text>
              
              {transcription && (
                <Group gap="xs">
                  <CopyButton value={transcription} timeout={2000}>
                    {({ copied, copy }) => (
                      <Tooltip label={copied ? 'Copied' : 'Copy'} withArrow position="right">
                        <ActionIcon color={copied ? 'teal' : 'gray'} variant="subtle" onClick={copy}>
                          {copied ? <Check size={16} /> : <Copy size={16} />}
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </CopyButton>
                  <Tooltip label="Download as .txt" withArrow>
                    <ActionIcon color="teal" variant="subtle" onClick={handleDownload}>
                      <Download size={16} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              )}
            </Group>
            
            <Textarea
              value={transcription}
              placeholder={loading ? "Transcribing your audio... This may take a few seconds." : "Transcription will appear here..."}
              minRows={6}
              autosize
              maxRows={15}
              readOnly
              className="w-full"
              styles={{ input: { fontFamily: 'inherit' } }}
            />
            
            {!loading && transcription && (
              <AIInsightPanel 
                title="AI Correction & Summary" 
                description="Fix transcription errors, add punctuation, and get a quick summary."
                insightResult={aiInsight}
                loading={aiLoading}
                onGenerate={handleGenerateInsight}
                color="teal"
              />
            )}
          </Stack>
        )}
      </Stack>
    </Card>
  );
}
