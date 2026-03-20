import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MAS Asset Viewer",
  description: "Maximo Application Suite Asset Viewer with Hero Landing",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

// Made with Bob
