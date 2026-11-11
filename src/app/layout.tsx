import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BEWACHEN — When you can't explain, let your information speak.",
  description:
    "A user-controlled safety PWA. Generate emergency QR codes and access local emergency services instantly.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-bewachen-dark text-bewachen-text antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
