import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";

import { QueryProvider } from "@/providers/query-provider";
import BottomNav from "@/components/bottom-nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Student Portal",
  description: "Production-ready student portal for Abscissa AI",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  interactiveWidget: "resizes-content",
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
          <BottomNav />
        </QueryProvider>
      </body>
    </html>
  );
}
