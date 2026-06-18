import type { Metadata } from "next";
import { Rajdhani, Share_Tech_Mono } from "next/font/google";
import "./globals.css";

const rajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-rajdhani",
  display: "swap",
});

const shareTechMono = Share_Tech_Mono({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-share-tech-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pascal's Wager | Decision-Theory Instrument",
  description:
    "A live decision-theory instrument for exploring Pascal's Wager under your own assumptions. Extended-real arithmetic, four decision rules, exact break-even sensitivity.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${rajdhani.variable} ${shareTechMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
