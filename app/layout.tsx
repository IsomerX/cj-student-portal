import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";

import { QueryProvider } from "@/providers/query-provider";
import BottomNav from "@/components/bottom-nav";
import InstallAssistant from "@/components/pwa/install-assistant";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "CJ Student",
    template: "%s | CJ Student",
  },
  description: "Join CJ live classes, open recordings, and launch the student portal like an app.",
  applicationName: "CJ Student",
  manifest: "/manifest.webmanifest",
  formatDetection: {
    telephone: false,
  },
  appleWebApp: {
    capable: true,
    title: "CJ Student",
    statusBarStyle: "black-translucent",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
  themeColor: "#143f46",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <QueryProvider>
          {children}
          <InstallAssistant />
          <BottomNav />
        </QueryProvider>
      </body>
    </html>
  );
}
