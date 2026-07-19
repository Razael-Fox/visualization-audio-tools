"use client";

import { useState } from "react";
import { Card, Group, Text, Button, Collapse, Stack, Loader, ThemeIcon } from "@mantine/core";
import { Sparkles, ChevronDown, ChevronUp } from "lucide-react";

interface AIInsightPanelProps {
  title: string;
  description: string;
  insightResult: string | null;
  loading: boolean;
  onGenerate: () => void;
  color?: string;
}

export function AIInsightPanel({
  title,
  description,
  insightResult,
  loading,
  onGenerate,
  color = "blue"
}: AIInsightPanelProps) {
  const [opened, setOpened] = useState(true);

  return (
    <Card withBorder shadow="sm" radius="md" p="md" className="w-full mt-6 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 border-indigo-100 dark:border-indigo-900/50">
      <Group justify="space-between" align="center" mb={opened || insightResult ? "md" : 0}>
        <Group gap="sm" onClick={() => setOpened(!opened)} className="cursor-pointer">
          <ThemeIcon variant="light" color={color} size="md" radius="xl">
            <Sparkles size={16} />
          </ThemeIcon>
          <div>
            <Text fw={600} size="sm">{title}</Text>
            <Text size="xs" c="dimmed">{description}</Text>
          </div>
        </Group>
        
        <Group gap="sm">
          {!insightResult && (
            <Button 
              size="xs" 
              variant="light" 
              color={color} 
              onClick={onGenerate} 
              loading={loading}
              leftSection={<Sparkles size={14} />}
            >
              Generate Insight
            </Button>
          )}
          <Button variant="subtle" size="xs" color="gray" p={4} onClick={() => setOpened(!opened)}>
            {opened ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </Button>
        </Group>
      </Group>

      <Collapse in={opened}>
        {loading && (
          <Group justify="center" py="xl">
            <Loader size="sm" color={color} type="dots" />
            <Text size="sm" c="dimmed">AI is analyzing...</Text>
          </Group>
        )}

        {insightResult && !loading && (
          <Stack gap="sm" className="bg-white dark:bg-dark-700 p-4 rounded-md border border-gray-100 dark:border-dark-500 shadow-sm mt-2">
            <Text size="sm" className="whitespace-pre-line leading-relaxed">
              {insightResult}
            </Text>
          </Stack>
        )}
      </Collapse>
    </Card>
  );
}
