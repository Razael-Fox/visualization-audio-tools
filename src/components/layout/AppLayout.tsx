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
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, FileAudio, Mic } from "lucide-react";
import { ColorSchemesSwitcher } from "@/components/color-schemes-switcher";
import { GitHubLoginButton } from "@/components/Auth/GitHubLoginButton";
import { SiteBanner } from "@/components/SiteBanner/SiteBanner";

const links = [
  { link: "/", label: "Home", icon: Activity },
  { link: "/visualizer", label: "Audio Visualizer", icon: Activity },
  { link: "/speech-to-text", label: "Speech to Text", icon: Mic },
  { link: "/metadata", label: "Extract Metadata", icon: FileAudio },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [opened, { toggle }] = useDisclosure();
  const pathname = usePathname();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: "sm",
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShellHeader>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
            />
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
            <GitHubLoginButton />
            <ColorSchemesSwitcher />
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
                  ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium"
                  : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
              }`}
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
  );
}
