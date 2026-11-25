import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClaimKavach — Hospital Bill Auditor",
  description:
    "AI reads your hospital bill. Deterministic rules judge it. Understand your bill before you pay. An educational verification tool for Indian families.",
  keywords: ["hospital bill", "insurance", "audit", "India", "claim", "verification"],
  robots: "noindex, nofollow", // Educational demo — not for public indexing
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-page-bg text-text-primary font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
