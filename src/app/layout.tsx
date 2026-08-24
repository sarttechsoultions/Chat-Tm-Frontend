import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ChatTm - Social Media App",
  description: "Connect and collaborate with your friends",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${plusJakarta.variable} h-full antialiased`}>
      <body
        className={`${plusJakarta.className} min-h-full flex flex-col bg-[#F9FAFB]`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
