"use client";

import { useMantineColorScheme, ActionIcon } from "@mantine/core";
import { Sun, Moon } from "lucide-react";

export function ColorSchemesSwitcher() {
  const { toggleColorScheme } = useMantineColorScheme();

  return (
    <ActionIcon
      variant="default"
      onClick={toggleColorScheme}
      size="lg"
      aria-label="Toggle color scheme"
    >
      <Sun size={18} className="hidden dark:block" />
      <Moon size={18} className="block dark:hidden" />
    </ActionIcon>
  );
}
