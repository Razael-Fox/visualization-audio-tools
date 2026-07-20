import { Container, Title, Text } from "@mantine/core";
import { AudioMetadataCore } from "@/components/AudioMetadata/AudioMetadataCore";

export default function AudioMetadataPage() {
  return (
    <Container size="xl" py="xl">
      <Title
        order={1}
        mb="md"
        className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-amber-500"
      >
        Audio Metadata Extractor
      </Title>
      <Text c="dimmed" mb="xl">
        Upload an audio file to view its ID3 tags, cover art, and technical
        details.
      </Text>

      <div className="mt-8">
        <AudioMetadataCore />
      </div>
    </Container>
  );
}
