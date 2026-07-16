import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "PandaCloud — Cloud, made gentle", description: "A polished hosting control plane for the modern web." };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" suppressHydrationWarning><body>{children}</body></html>;
}
