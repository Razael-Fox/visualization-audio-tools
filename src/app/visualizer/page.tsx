import { Container, Title, Text } from "@mantine/core";
import { AudioVisualizerCore } from "@/components/AudioVisualizer/AudioVisualizerCore";

export default function AudioVisualizerPage() {
  return (
    <Container size="xl" py="xl">
      <Title
        order={1}
        mb="md"
        className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-purple-500"
      >
        Audio Visualizer
      </Title>
      <Text c="dimmed" mb="xl">
        Upload any song or audio file to watch its sound waves and musical beats
        come to life in real-time. Customize the visualizer styles, colors, and get
        AI-powered acoustic insights of your audio.
      </Text>

      <div className="mt-8">
        <AudioVisualizerCore />
      </div>
    </Container>
  );
}
