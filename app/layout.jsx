import "./globals.css";
import AppShell from "./components/AppShell";

export const metadata = {
  title: {
    default: "PersonAIs · Alpha 0.4.0",
    template: "%s · PersonAIs",
  },
  description:
    "PersonAIs Alpha 0.4.0 — build and talk to your digital twin.",
};

export const viewport = {
  themeColor: "#b6e6fb",
};

// The root layout is a Server Component again so it can export metadata; all
// the interactive chrome lives in <AppShell>.
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="aero-bg min-h-screen text-aero-ink">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
