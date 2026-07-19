import { Container, Title, Text } from "@mantine/core";
import { SpeechToTextCore } from "@/components/SpeechToText/SpeechToTextCore";

export default function SpeechToTextPage() {
  return (
    <Container size="xl" py="xl">
      <Title order={1} mb="md" className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-500 to-emerald-500">
        Speech to Text
      </Title>
      <Text c="dimmed" mb="xl">
        Upload an audio file to accurately transcribe speech to text using Groq Whisper API.
      </Text>
      
      <div className="mt-8">
        <SpeechToTextCore />
      </div>
    </Container>
  );
}
