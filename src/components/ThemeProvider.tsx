"use client";

import { MantineProvider } from "@mantine/core";
import theme from "@/app/theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <MantineProvider theme={theme} defaultColorScheme="auto">
      {children}
    </MantineProvider>
  );
}
