"use client";

import { useState } from "react";
import {
  Button,
  Card,
  Group,
  Stack,
  Text,
  FileButton,
  Grid,
  Badge,
  Image as MantineImage,
  Alert,
  Collapse,
  Skeleton,
  Menu,
  ActionIcon,
  CopyButton,
  Tooltip,
} from "@mantine/core";
import {
  FileAudio,
  Upload,
  AlertCircle,
  Copy,
  Check,
  Download,
  ChevronDown,
} from "lucide-react";
import { parseBlob } from "music-metadata";
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

function escapeXml(str: string): string {
  return str.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      default:
        return c;
    }
  });
}

function escapeToml(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
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

  const {
    canUpload,
    canGenerateAi,
    incrementUpload,
    incrementAi,
    checkDuration,
  } = useUsageLimit();

  const handleGenerateInsight = async () => {
    if (!metadata) return;
    setLimitError(null);

    if (!canGenerateAi) {
      setLimitError(
        "You have reached the AI generation limit for this session.",
      );
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
        picture:
          common.picture && common.picture.length > 0
            ? {
                format: common.picture[0].format,
                data: Array.from(common.picture[0].data),
              }
            : undefined,
      });

      setLoadProgress(100);
      setTimeout(() => {
        setLoading(false);
        setLoadProgress(0);
      }, 400); // brief pause at 100% before resetting
    } catch (err) {
      console.error("Error reading tags:", err);
      setError(
        "Failed to read audio metadata. File might not contain supported tags.",
      );
      setLoading(false);
      setLoadProgress(0);
    } finally {
      clearInterval(progressInterval);
    }
  };

  const handleDownload = (formatType: string) => {
    if (!metadata && !fileName) return;

    const dataMap = {
      fileName: fileName || "",
      fileSize: fileSize || "",
      fileType: fileType || "",
      title: metadata?.title || "",
      artist: metadata?.artist || "",
      album: metadata?.album || "",
      year: metadata?.year || "",
      track: metadata?.track || "",
      genre: metadata?.genre || "",
    };

    let content = "";
    const baseFilename = fileName
      ? fileName.replace(/\.[^/.]+$/, "")
      : "audio_metadata";
    let extension = "txt";

    switch (formatType) {
      case "jsonl":
        content = JSON.stringify(dataMap) + "\n";
        extension = "jsonl";
        break;

      case "json":
        content = JSON.stringify(dataMap, null, 2);
        extension = "json";
        break;

      case "xml":
        content =
          `<?xml version="1.0" encoding="UTF-8"?>\n<audioMetadata>\n` +
          Object.entries(dataMap)
            .map(([k, v]) => `  <${k}>${escapeXml(v)}</${k}>`)
            .join("\n") +
          `\n</audioMetadata>\n`;
        extension = "xml";
        break;

      case "toml":
        content =
          `[metadata]\n` +
          Object.entries(dataMap)
            .map(([k, v]) => `${k} = "${escapeToml(v)}"`)
            .join("\n") +
          `\n`;
        extension = "toml";
        break;

      case "txt":
        content = [
          `+ File Name: ${dataMap.fileName}`,
          `+ File Size: ${dataMap.fileSize}`,
          `+ File Type: ${dataMap.fileType}`,
          `+ Title: ${dataMap.title}`,
          `+ Artist: ${dataMap.artist}`,
          `+ Album: ${dataMap.album}`,
          `+ Year: ${dataMap.year}`,
          `+ Track: ${dataMap.track}`,
          `+ Genre: ${dataMap.genre}`,
        ].join("\n");
        extension = "txt";
        break;

      case "markdown":
        content =
          `# Audio Metadata\n\n` +
          [
            `- **File Name:** ${dataMap.fileName}`,
            `- **File Size:** ${dataMap.fileSize}`,
            `- **File Type:** ${dataMap.fileType}`,
            `- **Title:** ${dataMap.title}`,
            `- **Artist:** ${dataMap.artist}`,
            `- **Album:** ${dataMap.album}`,
            `- **Year:** ${dataMap.year}`,
            `- **Track:** ${dataMap.track}`,
            `- **Genre:** ${dataMap.genre}`,
          ].join("\n") +
          `\n`;
        extension = "md";
        break;

      case "js-var":
        content = `const audioMetadata = ${JSON.stringify(dataMap, null, 2)};\n`;
        extension = "js";
        break;

      case "js-array":
        const arr = Object.entries(dataMap).map(([key, value]) => ({
          key,
          value,
        }));
        content = `const audioMetadataArray = ${JSON.stringify(arr, null, 2)};\n`;
        extension = "js";
        break;
    }

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${baseFilename}_metadata.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderFieldRow = (
    label: string,
    val: string | undefined | null,
    isBadge = false,
  ) => {
    const displayVal = val || "—";
    const canCopy = !!val && val !== "—";

    return (
      <>
        <Grid.Col span={4}>
          <Text size="sm" c="dimmed">
            {label}:
          </Text>
        </Grid.Col>
        <Grid.Col span={8}>
          <Group gap="xs" align="center" wrap="nowrap">
            {isBadge && val ? (
              <Badge color="metadata" variant="light">
                {val}
              </Badge>
            ) : (
              <Text size="sm" fw={500} style={{ wordBreak: "break-word" }}>
                {displayVal}
              </Text>
            )}

            {canCopy && (
              <CopyButton value={val}>
                {({ copied, copy }) => (
                  <Tooltip
                    label={copied ? "Copied" : "Copy"}
                    withArrow
                    position="top"
                  >
                    <ActionIcon
                      color={copied ? "teal" : "gray"}
                      variant="subtle"
                      size="xs"
                      onClick={copy}
                      aria-label={`Copy ${label}`}
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                    </ActionIcon>
                  </Tooltip>
                )}
              </CopyButton>
            )}
          </Group>
        </Grid.Col>
      </>
    );
  };

  // Create Object URL for image data
  let coverArtUrl = "";
  if (metadata?.picture) {
    const { data, format } = metadata.picture;
    const base64String = data.reduce(
      (acc, curr) => acc + String.fromCharCode(curr),
      "",
    );
    coverArtUrl = `data:${format};base64,${btoa(base64String)}`;
  }

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
            <FileAudio size={28} className="text-orange-500" />
            <div>
              <Text fw={700} size="xl">
                Audio Metadata Extractor
              </Text>
              <Text size="sm" c="dimmed">
                Extract and view ID3 tags from your audio files
              </Text>
            </div>
          </Group>
          <FileButton onChange={handleFileUpload} accept="audio/*">
            {(props) => (
              <Button
                {...props}
                leftSection={!loading && <Upload size={16} />}
                variant={loading ? "filled" : "light"}
                color="metadata"
                disabled={loading}
                style={{
                  position: "relative",
                  overflow: "hidden",
                  transition:
                    "background-color 0.3s ease, color 0.3s ease, border-color 0.3s ease",
                  color: loading ? "#ffffff" : undefined,
                }}
              >
                {loading && (
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      height: "100%",
                      width: `${loadProgress}%`,
                      backgroundColor: "var(--mantine-color-metadata-filled)",
                      transition: "width 0.15s ease-out, opacity 0.3s ease",
                      opacity: loading ? 1 : 0,
                      zIndex: 0,
                    }}
                  />
                )}
                <span
                  style={{
                    position: "relative",
                    zIndex: 1,
                    color: loading ? "#ffffff" : undefined,
                    transition: "color 0.3s ease",
                    fontWeight: 600,
                  }}
                >
                  {loading
                    ? `Processing... ${loadProgress}%`
                    : "Select Audio File"}
                </span>
              </Button>
            )}
          </FileButton>
        </Group>

        {error && (
          <Text
            c="red"
            size="sm"
            p="sm"
            className="bg-red-50 dark:bg-red-900/20 rounded-md"
          >
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
                  <Skeleton
                    height={30}
                    width="60%"
                    radius="sm"
                    animate
                    mb="sm"
                  />
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
                    <Group
                      justify="space-between"
                      align="center"
                      className="border-b border-gray-200 dark:border-dark-500 pb-2"
                    >
                      <Text fw={600} size="lg">
                        ID3 Tags & Information
                      </Text>
                      <Menu shadow="md" width={200} position="bottom-end">
                        <Menu.Target>
                          <Button
                            variant="light"
                            color="metadata"
                            size="xs"
                            leftSection={<Download size={14} />}
                            rightSection={<ChevronDown size={14} />}
                          >
                            Download
                          </Button>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Label>Export Format</Menu.Label>
                          <Menu.Item onClick={() => handleDownload("jsonl")}>
                            JSONL (.jsonl)
                          </Menu.Item>
                          <Menu.Item onClick={() => handleDownload("json")}>
                            JSON (.json)
                          </Menu.Item>
                          <Menu.Item onClick={() => handleDownload("xml")}>
                            XML (.xml)
                          </Menu.Item>
                          <Menu.Item onClick={() => handleDownload("toml")}>
                            TOML (.toml)
                          </Menu.Item>
                          <Menu.Item onClick={() => handleDownload("txt")}>
                            TXT (.txt)
                          </Menu.Item>
                          <Menu.Item onClick={() => handleDownload("markdown")}>
                            MARKDOWN (.md)
                          </Menu.Item>
                          <Menu.Item onClick={() => handleDownload("js-var")}>
                            JAVASCRIPT VARIABLE (.js)
                          </Menu.Item>
                          <Menu.Item onClick={() => handleDownload("js-array")}>
                            ARRAY (.js)
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Group>

                    <Grid align="center" gutter="xs">
                      {renderFieldRow("File Name", fileName)}
                      {renderFieldRow("File Size", fileSize)}
                      {renderFieldRow("File Type", fileType, true)}
                      {renderFieldRow("Title", metadata.title)}
                      {renderFieldRow("Artist", metadata.artist)}
                      {renderFieldRow("Album", metadata.album)}
                      {renderFieldRow("Year", metadata.year)}
                      {renderFieldRow("Track", metadata.track)}
                      {renderFieldRow("Genre", metadata.genre, true)}
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

