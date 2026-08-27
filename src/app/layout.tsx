import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { MotionProvider } from "@/components/providers/motion-provider";
import { LocaleProvider } from "@/lib/i18n/locale-provider";
import { getLocale } from "@/lib/i18n/get-locale";
import { siteConfig } from "@/config/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
  // No custom logo asset exists yet — the default `favicon.ico` file
  // convention (src/app/favicon.ico) handles the tab icon on its own; an
  // explicit `icons` entry pointing at a file that doesn't exist would
  // override that default with nothing. Add `icons: { icon:
  // "/brand/profymind-logo.png" }` back once that file is actually in
  // place — see ProfyMindLogo for the same asset used everywhere else.
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <MotionProvider>
            <LocaleProvider initialLocale={locale}>
              {children}
              <Toaster />
            </LocaleProvider>
          </MotionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
