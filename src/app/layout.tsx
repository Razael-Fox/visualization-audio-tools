import type { Metadata } from "next";
import {
  ColorSchemeScript,
  mantineHtmlProps,
  MantineProvider,
} from "@mantine/core";
import theme from "./theme";
import "./globals.css";
import { AppLayout } from "@/components/layout/AppLayout";
import { Outfit } from "next/font/google";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: {
    default: "VANT - Visualization Audio & Tools",
    template: "%s | VANT",
  },
  description: "Advanced web-based audio tools. Visualize waveforms in real-time, extract ID3 metadata, and transcribe speech to text using AI.",
  keywords: ["audio visualizer", "speech to text", "audio metadata", "id3 tags", "AI transcription", "web audio"],
  authors: [{ name: "Razael Fox" }],
  creator: "Razael Fox",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://www.razael-fox.my.id",
    title: "VANT - Visualization Audio & Tools",
    description: "Advanced web-based audio tools for visualization, metadata extraction, and AI transcription.",
    siteName: "VANT",
  },
  twitter: {
    card: "summary_large_image",
    title: "VANT - Visualization Audio & Tools",
    description: "Advanced web-based audio tools for visualization, metadata extraction, and AI transcription.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript />
      </head>
      <body className={`antialiased ${outfit.variable} font-sans`}>
        <MantineProvider theme={theme}>
          <AppLayout>{children}</AppLayout>
        </MantineProvider>
      </body>
    </html>
  );
}
