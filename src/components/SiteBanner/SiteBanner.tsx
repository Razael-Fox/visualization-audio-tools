"use client";

import { useEffect, useState } from "react";
import { Alert, Button, Group } from "@mantine/core";
import { Info } from "lucide-react";
import { usePathname } from "next/navigation";

export function SiteBanner() {
  const [mounted, setMounted] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const pathname = usePathname();

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

  const isHome = pathname === "/";

  return (
    <Alert
      icon={<Info size={16} />}
      title="Heads up!"
      color="blue"
      variant="light"
      withCloseButton
      onClose={handleDismiss}
      mb="md"
      mt={{ base: isHome ? "4.5rem" : 0, sm: 0 }}
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
