import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aiden Sales | AI-Powered Sales Platform",
  description: "Smarter outreach. Powered by AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex">{children}</body>
    </html>
  );
}
