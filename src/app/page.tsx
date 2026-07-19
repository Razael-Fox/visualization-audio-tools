"use client";

import { Button, Card, Container, Grid, Group, Text, Title, ThemeIcon } from "@mantine/core";
import Link from "next/link";
import { Activity, FileAudio, Mic, Sparkles } from "lucide-react";

export default function Home() {
  const features = [
    {
      title: "Audio Visualizer",
      description: "Visualize audio waveform and frequency spectrum in real-time.",
      icon: Activity,
      color: "blue",
      href: "/visualizer"
    },
    {
      title: "Speech-to-Text",
      description: "Convert audio and voice to text efficiently with high accuracy.",
      icon: Mic,
      color: "teal",
      href: "/speech-to-text"
    },
    {
      title: "Extract Metadata",
      description: "Parse and view ID3 tags and technical details from your audio files.",
      icon: FileAudio,
      color: "orange",
      href: "/metadata"
    }
  ];

  return (
    <Container size="lg" py="xl">
      <div className="flex flex-col items-center text-center max-w-[800px] mx-auto py-16">
        <Title order={1} className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
          VANT - <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-400">Visualization Audio And Tools</span>
        </Title>
        <Text c="dimmed" size="xl" className="mb-10 max-w-[600px]">
          A tool for visualizing audio, along with other useful tools designed for audio, featuring AI-powered functionality to assist with
        </Text>
        <Group justify="center">
          <Button component={Link} href="/visualizer" size="lg" radius="md" rightSection={<Activity size={18} />}>
            Try Visualizer
          </Button>
          <Button component={Link} href="/speech-to-text" variant="light" size="lg" radius="md" rightSection={<Mic size={18} />}>
            Transcribe Audio
          </Button>
        </Group>
      </div>

      <Grid gap="xl" mt={50}>
        {features.map((feature) => (
          <Grid.Col key={feature.title} span={{ base: 12, md: 4 }}>
            <Card shadow="sm" padding="xl" radius="md" withBorder className="h-full flex flex-col hover:-translate-y-1 transition-transform duration-200">
              <ThemeIcon size={50} radius="md" color={feature.color} variant="light" className="mb-4">
                <feature.icon size={26} />
              </ThemeIcon>
              <Text fw={600} size="lg" mb="sm">
                {feature.title}
              </Text>
              <Text size="sm" c="dimmed" className="flex-1">
                {feature.description}
              </Text>
              
              <Group mt="xl">
                <Button component={Link} href={feature.href} variant="subtle" color={feature.color} px={0}>
                  Open Tool →
                </Button>
              </Group>
            </Card>
          </Grid.Col>
        ))}
      </Grid>
    </Container>
  );
}
