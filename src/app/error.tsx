"use client";

import { useEffect } from "react";
import {
  Button,
  Container,
  Group,
  Text,
  Title,
  ThemeIcon,
} from "@mantine/core";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Optionally log the error to an error reporting service
    console.error("Global Error Boundary caught:", error);
  }, [error]);

  return (
    <Container
      size="sm"
      py="xl"
      className="min-h-[70vh] flex flex-col items-center justify-center text-center"
    >
      <ThemeIcon
        size={80}
        radius="100%"
        color="red"
        variant="light"
        className="mb-6"
      >
        <AlertTriangle size={40} />
      </ThemeIcon>

      <Title order={1} className="text-3xl md:text-4xl font-bold mb-4">
        Oops! Something went wrong
      </Title>

      <Text c="dimmed" size="lg" className="mb-8 max-w-[500px]">
        We encountered an unexpected error while processing your request. Please
        try again or return to the homepage.
      </Text>

      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md border border-red-100 dark:border-red-800/30 mb-8 max-w-full overflow-hidden text-left">
        <Text size="sm" c="red" className="font-mono truncate">
          {error.message || "Unknown error occurred"}
        </Text>
      </div>

      <Group justify="center">
        <Button
          size="md"
          onClick={() => reset()}
          leftSection={<RefreshCw size={16} />}
          color="red"
        >
          Try Again
        </Button>
        <Button
          component={Link}
          href="/"
          size="md"
          variant="default"
          leftSection={<Home size={16} />}
        >
          Go Home
        </Button>
      </Group>
    </Container>
  );
}
