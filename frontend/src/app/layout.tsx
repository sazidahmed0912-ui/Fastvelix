import type { Metadata, Viewport } from "next";
import { Roboto } from "next/font/google";
import JsonLd from "@/components/JsonLd";
import {
  APP_DESCRIPTION,
  APP_NAME,
  BASE_URL,
  KEYWORDS,
  organizationJsonLd,
  websiteJsonLd,
} from "@/lib/seo";
import "./globals.css";

const roboto = Roboto({
  variable: "--font-roboto",
  weight: ["400", "500", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: `${APP_NAME} — Fashion & Cakes & Bakes Online Shopping in India`,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  keywords: KEYWORDS,
  applicationName: APP_NAME,
  category: "ecommerce",
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    url: BASE_URL,
    siteName: APP_NAME,
    title: `${APP_NAME} — Fashion & Cakes & Bakes Online Shopping in India`,
    description: APP_DESCRIPTION,
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} — Fashion & Cakes & Bakes Online Shopping in India`,
    description: APP_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#16a34a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${roboto.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={websiteJsonLd()} />
        {children}
      </body>
    </html>
  );
}
