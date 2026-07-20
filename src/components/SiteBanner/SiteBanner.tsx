"use client";

import { useEffect, useState } from "react";
import { Alert, Button, Group } from "@mantine/core";
import { Info } from "lucide-react";

export function SiteBanner() {
  const [mounted, setMounted] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line
    setMounted(true);
    const dismissed = localStorage.getItem("vant_banner_dismissed");
    if (dismissed === "true") {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem("vant_banner_dismissed", "true");
    setIsDismissed(true);
  };

  if (!mounted || isDismissed) return null;

  return (
    <Alert
      icon={<Info size={16} />}
      title="Heads up!"
      color="blue"
      variant="light"
      withCloseButton
      onClose={handleDismiss}
      mb="md"
    >
      <Group justify="space-between" align="center">
        <span>
          VANT is currently in early development. You might encounter some bugs
          or usage limits.
        </span>
        <Button
          component="a"
          href="https://www.razael-fox.my.id/go/discord"
          target="_blank"
          rel="noreferrer"
          variant="light"
          size="xs"
        >
          Join our Discord
        </Button>
      </Group>
    </Alert>
  );
}
