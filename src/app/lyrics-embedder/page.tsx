import { Container, Title, Text, Alert } from "@mantine/core";
import { LyricsEmbedderCore } from "@/components/LyricsEmbedder/LyricsEmbedderCore";
import { Info } from "lucide-react";
import ReactMarkdown from "react-markdown";

export const metadata = {
  title: "Lyrics Embedder - VANT",
  description:
    "Embed synchronized and unsynchronized lyrics (.lrc/.txt) into audio files metadata.",
};

export default function LyricsEmbedderPage() {
  return (
    <Container size="xl" py="xl">
      <Title
        order={1}
        mb="md"
        className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-rose-500"
      >
        Lyrics Audio Embedder
      </Title>
      <Text c="dimmed" mb="xl">
        Add lyrics directly inside your music files (.mp3, .opus, .flac, .m4a, .ogg). You can upload a
        .lrc file for scrolling karaoke-style lyrics, a .txt file for standard
        static text, or use our interactive tool to sync them manually.
      </Text>

      <div className="mt-8">
        <LyricsEmbedderCore />
      </div>

      <Alert
        variant="light"
        color="blue"
        title="Format Support Note"
        icon={<Info size={16} />}
        mt="lg"
        radius="md"
      >
        <ReactMarkdown className="text-sm font-sans leading-relaxed">
          This tool natively supports embedding lyrics into **.mp3, .opus, .flac, .m4a, and .ogg** audio files.
          Standard ID3v2.3 tags are used for MP3s, while other formats use their respective native metadata tags (like Vorbis Comments).
        </ReactMarkdown>
      </Alert>
    </Container>
  );
}
