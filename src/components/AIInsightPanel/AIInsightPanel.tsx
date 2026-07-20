"use client";

import {
  Card,
  Group,
  Text,
  Button,
  Collapse,
  Stack,
  Loader,
  ThemeIcon,
  Badge,
} from "@mantine/core";
import { Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
  color = "blue",
}: AIInsightPanelProps) {
  return (
    <Card
      withBorder
      shadow="sm"
      radius="md"
      p="md"
      className="w-full mt-6 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-950/20 dark:to-purple-950/20 border-indigo-100 dark:border-indigo-900/50"
    >
      <Group
        justify="space-between"
        align="center"
        mb={loading || insightResult ? "md" : 0}
      >
        <Group gap="sm">
          <ThemeIcon variant="light" color={color} size="md" radius="xl">
            <Sparkles size={16} />
          </ThemeIcon>
          <div>
            <Text fw={600} size="sm">
              {title}
            </Text>
            <Text size="xs" c="dimmed">
              {description}
            </Text>
          </div>
        </Group>

        <Group gap="sm">
          <Button
            size="xs"
            variant="light"
            color={color}
            onClick={onGenerate}
            loading={loading}
            leftSection={<Sparkles size={14} />}
          >
            {insightResult ? "Regenerate" : "Generate Insight"}
          </Button>
        </Group>
      </Group>

      <Collapse expanded={loading || !!insightResult}>
        {loading && (
          <Group justify="center" py="xl">
            <Loader size="sm" color={color} type="dots" />
            <Text size="sm" c="dimmed">
              AI is analyzing...
            </Text>
          </Group>
        )}

        {insightResult && !loading && (
          <Stack
            gap="sm"
            className="bg-white dark:bg-dark-700 p-4 rounded-md border border-gray-100 dark:border-dark-500 shadow-sm mt-2"
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code(props) {
                  const { children, className, node: _node, ...rest } = props;
                  const text = String(children);
                  const isTimestamp = /^\\d{1,2}:\\d{2}(?::\\d{2})?$/.test(
                    text,
                  );

                  if (isTimestamp) {
                    return (
                      <Badge
                        size="sm"
                        variant="light"
                        color={color}
                        className="font-mono"
                      >
                        {text}
                      </Badge>
                    );
                  }

                  return (
                    <code className={className} {...rest}>
                      {children}
                    </code>
                  );
                },
                p(props) {
                  return (
                    <Text size="sm" mb="xs" className="leading-relaxed">
                      {props.children}
                    </Text>
                  );
                },
                strong(props) {
                  return (
                    <Text component="span" fw={700}>
                      {props.children}
                    </Text>
                  );
                },
                ul(props) {
                  return (
                    <ul className="list-disc pl-5 mb-2 text-sm">
                      {props.children}
                    </ul>
                  );
                },
                ol(props) {
                  return (
                    <ol className="list-decimal pl-5 mb-2 text-sm">
                      {props.children}
                    </ol>
                  );
                },
                li(props) {
                  return <li className="mb-1">{props.children}</li>;
                },
              }}
            >
              {insightResult.replace(/\b(\d{1,2}:\d{2}(?::\d{2})?)\b/g, "`$1`")}
            </ReactMarkdown>
          </Stack>
        )}
      </Collapse>
    </Card>
  );
}
