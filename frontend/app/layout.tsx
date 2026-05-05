import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/components/scripts/QueryProvider";

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
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}

// Made with Bob
