import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { BottomNav } from "@/components/bottom-nav";

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
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
      appearance={{
        variables: {
          colorPrimary: "#ffffff",
          colorPrimaryForeground: "#000000",
          colorForeground: "#ffffff",
          colorMutedForeground: "#8e8e93",
          colorBackground: "#1c1c1e",
          colorInput: "#2c2c2e",
          colorInputForeground: "#ffffff",
          colorBorder: "#38383a",
          borderRadius: "0.75rem",
        },
      }}
    >
      <html
        lang="en"
        className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col bg-background text-foreground">
          <main className="safe-top flex-1 w-full max-w-lg mx-auto px-4 pb-24">
            {children}
          </main>
          <BottomNav />
        </body>
      </html>
    </ClerkProvider>
  );
}
