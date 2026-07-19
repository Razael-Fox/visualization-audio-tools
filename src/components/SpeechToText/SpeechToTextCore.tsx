"use client";

import { useState } from "react";
import { Button, Card, Group, Stack, Text, FileButton, Textarea, ActionIcon, CopyButton, Tooltip, Alert, Collapse, Skeleton } from "@mantine/core";
import { Mic, Upload, Copy, Check, Download, AlertCircle } from "lucide-react";
import { AIInsightPanel } from "@/components/AIInsightPanel/AIInsightPanel";
import { useUsageLimit } from "@/hooks/useUsageLimit";

export function SpeechToTextCore() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [transcription, setTranscription] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [limitError, setLimitError] = useState<string | null>(null);

  const { canUpload, canGenerateAi, incrementUpload, incrementAi, checkDuration } = useUsageLimit();

  const handleGenerateInsight = async () => {
    if (!transcription) return;
    setLimitError(null);
    
    if (!canGenerateAi) {
      setLimitError("You have reached the AI generation limit for this session.");
      return;
    }
    
    await incrementAi();
    
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

  const handleFileUpload = async (selectedFile: File | null) => {
    if (!selectedFile) return;
    setLimitError(null);
    
    if (!canUpload) {
      setLimitError("You have reached the maximum upload limit for this session.");
      return;
    }
    
    const isValidDuration = await checkDuration(selectedFile);
    if (!isValidDuration) {
      setLimitError("Audio file exceeds the 10-minute duration limit.");
      return;
    }

    await incrementUpload();

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
        {limitError && (
          <Alert icon={<AlertCircle size={16} />} title="Usage Limit Reached" color="red" variant="light" withCloseButton onClose={() => setLimitError(null)}>
            {limitError} Please <a href="https://www.razael-fox.my.id/go/discord" target="_blank" rel="noreferrer" className="underline">Join our Discord</a> for more info.
          </Alert>
        )}
        <Group justify="space-between" align="flex-start">
          <Group gap="sm" align="center">
            <Mic size={28} className="text-teal-500" />
            <div>
              <Text fw={700} size="xl">Speech to Text</Text>
              <Text size="sm" c="dimmed">Transcribe audio files into text accurately</Text>
            </div>
          </Group>
          <FileButton onChange={handleFileUpload} accept="audio/*">
            {(props) => (
              <Button {...props} leftSection={<Upload size={16} />} variant="light" color="stt">
                Select Audio
              </Button>
            )}
          </FileButton>
        </Group>

        <Collapse in={!!file}>
          <Stack gap="md" mt="md">
            <Group justify="space-between" p="sm" className="bg-gray-50 dark:bg-dark-600 rounded-md border border-gray-100 dark:border-dark-500">
              <Text size="sm" fw={500} truncate className="flex-1">
                {file?.name}
              </Text>
              <Button 
                size="sm" 
                color="stt" 
                onClick={handleTranscribe} 
                loading={loading}
              >
                Transcribe Now
              </Button>
            </Group>

            {error && (
              <Text c="red" size="sm" p="sm" className="bg-red-50 dark:bg-red-900/20 rounded-md">
                {error}
              </Text>
            )}

            <Collapse in={loading || !!transcription}>
              <Stack gap="sm">
                <Group justify="space-between" align="center">
                  <Text fw={500} size="sm" c="dimmed">Result:</Text>
                  
                  {transcription && !loading && (
                    <Group gap="xs">
                      <CopyButton value={transcription} timeout={2000}>
                        {({ copied, copy }) => (
                          <Tooltip label={copied ? 'Copied' : 'Copy'} withArrow position="right">
                            <ActionIcon color={copied ? 'stt' : 'gray'} variant="subtle" onClick={copy}>
                              {copied ? <Check size={16} /> : <Copy size={16} />}
                            </ActionIcon>
                          </Tooltip>
                        )}
                      </CopyButton>
                      <Tooltip label="Download as .txt" withArrow>
                        <ActionIcon color="stt" variant="subtle" onClick={handleDownload}>
                          <Download size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  )}
                </Group>
                
                {loading ? (
                  <Stack gap="xs" mt="sm" mb="sm">
                    <Skeleton height={20} radius="sm" width="100%" animate />
                    <Skeleton height={20} radius="sm" width="90%" animate />
                    <Skeleton height={20} radius="sm" width="95%" animate />
                    <Skeleton height={20} radius="sm" width="80%" animate />
                    <Skeleton height={20} radius="sm" width="85%" animate />
                  </Stack>
                ) : (
                  <Textarea
                    value={transcription}
                    minRows={6}
                    autosize
                    maxRows={15}
                    readOnly
                    className="w-full"
                    styles={{ input: { fontFamily: 'inherit' } }}
                  />
                )}
                
                {!loading && transcription && (
                  <AIInsightPanel 
                    title="AI Correction & Summary" 
                    description="Fix transcription errors, add punctuation, and get a quick summary."
                    insightResult={aiInsight}
                    loading={aiLoading}
                    onGenerate={handleGenerateInsight}
                    color="stt"
                  />
                )}
              </Stack>
            </Collapse>
          </Stack>
        </Collapse>
      </Stack>
    </Card>
  );
}
