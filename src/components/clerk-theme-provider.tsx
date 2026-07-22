"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { useSyncExternalStore } from "react";

const QUERY = "(prefers-color-scheme: dark)";

// Subscribe to the system color scheme the React-idiomatic way (no
// setState-in-effect). Server snapshot is `false` (light) to keep hydration
// stable; the client corrects immediately on mount.
function useSystemDark(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(QUERY);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}

// Monochrome Clerk palettes that mirror our CSS themes. Clerk generates color
// scales from these, so they must be concrete colors (not CSS vars) — hence we
// pick the right set from the live system preference rather than var(--accent).
const dark = {
  colorScheme: "dark",
  colorPrimary: "#ffffff",
  colorPrimaryForeground: "#000000",
  colorForeground: "#ffffff",
  colorMutedForeground: "#8e8e93",
  colorBackground: "#1c1c1e",
  colorInput: "#2c2c2e",
  colorInputForeground: "#ffffff",
  colorBorder: "#38383a",
  borderRadius: "0.75rem",
} as const;

const light = {
  colorScheme: "light",
  colorPrimary: "#000000",
  colorPrimaryForeground: "#ffffff",
  colorForeground: "#000000",
  colorMutedForeground: "#8e8e93",
  colorBackground: "#ffffff",
  colorInput: "#f2f2f7",
  colorInputForeground: "#000000",
  colorBorder: "#d1d1d6",
  borderRadius: "0.75rem",
} as const;

export function ClerkThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const isDark = useSystemDark();

  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      signInFallbackRedirectUrl="/"
      signUpFallbackRedirectUrl="/"
      appearance={{ variables: isDark ? dark : light }}
    >
      {children}
    </ClerkProvider>
  );
}
