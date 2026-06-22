import type { Metadata } from "next";
import localFont from "next/font/local";
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
  title: "Wyze Bundle Builder",
  description: "Build your personalized Wyze security system",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${gilroy.variable} h-full`}>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
