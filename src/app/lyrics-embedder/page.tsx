import { Container, Title, Text } from "@mantine/core";
import { LyricsEmbedderCore } from "@/components/LyricsEmbedder/LyricsEmbedderCore";

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
        Upload an audio file (.mp3) along with lyrics to embed them directly
        into the ID3 tags. You can also sync plain lyrics line-by-line using our
        interactive tap-sync utility.
      </Text>

      <div className="mt-8">
        <LyricsEmbedderCore />
      </div>
    </Container>
  );
}
