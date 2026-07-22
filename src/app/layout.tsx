import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BottomNav } from "@/components/bottom-nav";
import { ClerkThemeProvider } from "@/components/clerk-theme-provider";
import { SwUpdater } from "@/components/sw-updater";
import { getOrCreateUser } from "@/lib/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tenths — Everything, out of ten",
  description:
    "Rate the things you love on a scale of 0.0 to 10.0. Build your palate, follow your friends, and find the best.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Tenths",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f2f7" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const me = await getOrCreateUser();
  return (
    <ClerkThemeProvider>
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="bg-background text-foreground">
          <SwUpdater />
          <div className="app-shell">
            <main className="app-scroll safe-top">
              <div className="mx-auto w-full max-w-lg px-4 pb-8">
                {children}
              </div>
            </main>
            <BottomNav meHandle={me?.handle ?? null} />
          </div>
        </body>
      </html>
    </ClerkThemeProvider>
  );
}
