import "@/styles/globals.css";

import { type Metadata } from "next";
import { AuthProvider } from "@/lib/auth-context";
import { clashDisplay, satoshi } from "./fonts";
import { SmoothScrollProvider } from "@/components/scroll-scenes/smooth-scroll-provider";

export const metadata: Metadata = {
  title: "Smart Space Booking",
  description: "Dapatkan ruang kerja fleksibel dengan kemudahan booking online.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={`${clashDisplay.variable} ${satoshi.variable}`}>
      <body className="antialiased">
        <a href="#hero" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 z-[100] px-4 py-2 bg-paper-100 text-accent-500 underline">
          Skip to content
        </a>
        <SmoothScrollProvider>
          <AuthProvider>{children}</AuthProvider>
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
