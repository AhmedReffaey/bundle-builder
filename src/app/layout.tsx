import type { Metadata } from "next";
import localFont from "next/font/local";
import Script from "next/script";
import "./globals.css";

const gilroy = localFont({
  src: [
    { path: "../../public/fonts/Gilroy-Regular.woff",         weight: "400", style: "normal" },
    { path: "../../public/fonts/Gilroy-RegularItalic.woff",   weight: "400", style: "italic" },
    { path: "../../public/fonts/Gilroy-Medium.woff",          weight: "500", style: "normal" },
    { path: "../../public/fonts/Gilroy-MediumItalic.woff",    weight: "500", style: "italic" },
    { path: "../../public/fonts/Gilroy-SemiBold.woff",        weight: "600", style: "normal" },
    { path: "../../public/fonts/Gilroy-SemiBoldItalic.woff",  weight: "600", style: "italic" },
    { path: "../../public/fonts/Gilroy-Bold.woff",            weight: "700", style: "normal" },
    { path: "../../public/fonts/Gilroy-BoldItalic.woff",      weight: "700", style: "italic" },
    { path: "../../public/fonts/Gilroy-ExtraBold.woff",       weight: "800", style: "normal" },
    { path: "../../public/fonts/Gilroy-ExtraBoldItalic.woff", weight: "800", style: "italic" },
  ],
  variable: "--font-gilroy",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Wyze Bundle Builder | Customize Your Security System",
  description: "Build your personalized home security bundle. Mix cameras, sensors, and plans. Save up to 30% when you bundle.",
  openGraph: {
    title: "Wyze Bundle Builder",
    description: "Build your personalized home security bundle. Save on cameras, sensors & plans.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Wyze Bundle Builder",
    description: "Build your personalized home security bundle. Save on cameras, sensors & plans.",
  },
};

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${gilroy.variable} h-full`}>
      <body className="min-h-full antialiased">
        {children}
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4-init" strategy="afterInteractive">{`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}');
            `}</Script>
          </>
        )}
      </body>
    </html>
  );
}
