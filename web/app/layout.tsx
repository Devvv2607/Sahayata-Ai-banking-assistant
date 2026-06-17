import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sahayata AI — Branch Copilot",
  description:
    "AI-powered multilingual voice copilot for Indian bank branch officers.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
