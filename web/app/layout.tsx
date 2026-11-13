import type { Metadata } from "next";
import { connection } from "next/server";
import { Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "OM PVRD",
    template: "%s · OM PVRD",
  },
  description: "Premium hardware fittings catalogue — door handles, aldrops, kitchen accessories and more.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  await connection();
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${plusJakarta.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full bg-background font-sans text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
