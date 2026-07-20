"use client";

import {
  AppShell,
  AppShellHeader,
  AppShellMain,
  AppShellNavbar,
  Burger,
  Group,
  Text,
  UnstyledButton,
  Box,
  Portal,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { Activity, FileAudio, Mic, Home } from "lucide-react";
import { GitHubLoginButton } from "@/components/Auth/GitHubLoginButton";
import { SiteBanner } from "@/components/SiteBanner/SiteBanner";

const links = [
  { link: "/", label: "Home", icon: Home, color: "blue" },
  { link: "/visualizer", label: "Audio Visualizer", icon: Activity, color: "violet" },
  { link: "/speech-to-text", label: "Speech to Text", icon: Mic, color: "teal" },
  { link: "/metadata", label: "Extract Metadata", icon: FileAudio, color: "orange" },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [opened, { toggle, close }] = useDisclosure();
  const pathname = usePathname();

  useEffect(() => {
    close();
  }, [pathname, close]);

  return (
    <>
      <AppShell
        header={{ height: { base: 0, sm: 60 } }}
        navbar={{
          width: 300,
          breakpoint: "sm",
          collapsed: { mobile: !opened },
        }}
        padding="md"
      >
        <AppShellHeader visibleFrom="sm">
          <Group h="100%" px="md" justify="space-between">
            <Group>
              <Text
                component={Link}
                href="/"
                size="lg"
                fw={700}
                variant="gradient"
                gradient={{ from: "blue", to: "cyan", deg: 90 }}
              >
                VANT
              </Text>
            </Group>
            <Group>
              {/* Desktop Profile & Theme are handled here */}
              <GitHubLoginButton />
            </Group>
          </Group>
        </AppShellHeader>

        <AppShellNavbar p="md">
          <Group
            flex={1}
            style={{
              flexDirection: "column",
              gap: "0.5rem",
              alignItems: "stretch",
            }}
          >
            {links.map((item) => (
              <UnstyledButton
                component={Link}
                href={item.link}
                key={item.label}
                data-active={item.link === pathname || undefined}
                className={`flex items-center gap-3 p-3 rounded-md transition-colors ${
                  item.link === pathname
                    ? ""
                    : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                }`}
                style={
                  item.link === pathname
                    ? {
                        backgroundColor: `var(--mantine-color-${item.color}-light)`,
                        color: `var(--mantine-color-${item.color}-light-color)`,
                        fontWeight: 500,
                      }
                    : {}
                }
              >
                <item.icon size={20} />
                <Text size="sm">{item.label}</Text>
              </UnstyledButton>
            ))}
          </Group>
        </AppShellNavbar>

        <AppShellMain>
          <SiteBanner />
          {children}
        </AppShellMain>
      </AppShell>

      {/* Floating Buttons for Mobile */}
      <Portal>
        <Box
          hiddenFrom="sm"
          style={{
            position: "fixed",
            bottom: "max(1.5rem, env(safe-area-inset-bottom))",
            right: "max(1.5rem, env(safe-area-inset-right))",
            zIndex: 1000,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            width: "56px",
            height: "56px",
            backgroundColor: "var(--mantine-color-blue-filled)",
            borderRadius: "50%",
            boxShadow: "0 8px 16px rgba(0, 0, 0, 0.2)",
            cursor: "pointer",
          }}
          onClick={toggle}
        >
          <Burger
            opened={opened}
            onClick={toggle}
            size="sm"
            color="white"
            style={{
              pointerEvents: "none",
            }}
          />
        </Box>

        <Box
          hiddenFrom="sm"
          style={{
            position: "fixed",
            top: "max(1rem, env(safe-area-inset-top))",
            right: "max(1rem, env(safe-area-inset-right))",
            zIndex: 1000,
          }}
        >
          <GitHubLoginButton />
        </Box>
      </Portal>
    </>
  );
}

