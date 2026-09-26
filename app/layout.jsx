import "./globals.css";
import AppShell from "./components/AppShell";
import { THEME_BOOT_SCRIPT } from "./lib/theme";

export const metadata = {
  title: {
    default: "PersonAIs · Alpha 0.4.5",
    template: "%s · PersonAIs",
  },
  description:
    "PersonAIs Alpha 0.4.5 — build and talk to your digital twin.",
};

// Aero's toolbar tint. A colour theme swaps it once the page is running (see
// applyTheme in lib/theme.js).
export const viewport = {
  themeColor: "#b6e6fb",
};

// The root layout is a Server Component again so it can export metadata; all
// the interactive chrome lives in <AppShell>.
export default function RootLayout({ children }) {
  return (
    // The boot script sets data-theme on <html> before React hydrates, so the
    // attribute React finds differs from the one it rendered — on purpose.
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="aero-bg min-h-screen text-aero-ink">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
