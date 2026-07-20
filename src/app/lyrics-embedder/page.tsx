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
        Add lyrics directly inside your music files (.mp3). You can upload a
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
          Currently, this tool only supports embedding lyrics into **.mp3**
          files (using ID3v2.3 tags). Support for other audio formats (such as
          .opus, .ogg, .m4a, and .flac) is planned and will be added in a future
          update.
        </ReactMarkdown>
      </Alert>
    </Container>
  );
}
