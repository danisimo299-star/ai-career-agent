import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { MotionProvider } from "@/components/providers/motion-provider";
import { LocaleProvider } from "@/lib/i18n/locale-provider";
import { getLocale } from "@/lib/i18n/get-locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
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

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const seo = getDictionary(locale).seo;

  return {
    metadataBase: new URL(siteConfig.url),
    title: { default: seo.titleDefault, template: seo.titleTemplate },
    description: seo.description,
    openGraph: {
      title: seo.titleDefault,
      description: seo.description,
      url: siteConfig.url,
      siteName: siteConfig.name,
      locale: locale === "ru" ? "ru_RU" : "en_US",
      type: "website",
      // No real brand image exists on disk yet (`public/brand/` is empty —
      // see ProfyMindLogo's own graceful-404 fallback for the same asset).
      // Omitted rather than pointing OG previews at a 404.
    },
    twitter: {
      card: "summary",
      title: seo.titleDefault,
      description: seo.description,
    },
    // Deliberately no explicit `icons` field here — `favicon.ico`,
    // `icon.tsx`, and `apple-icon.tsx` in this same directory are Next's
    // file-based icon convention and are auto-detected into the right
    // `<link>` tags on their own. Adding an `icons` entry on top would
    // fight those (the exact "conflicting declarations" this app avoids).
  };
}

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
