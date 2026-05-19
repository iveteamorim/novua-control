import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeToggle } from "@/components/theme-toggle";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Novua Control",
  description:
    "Operational execution intelligence for product and engineering teams.",
};

const themeInitScript = `
  (function () {
    try {
      var savedTheme = localStorage.getItem("novua-theme");
      var theme = savedTheme === "dark" || savedTheme === "light" ? savedTheme : "light";
      document.documentElement.dataset.theme = theme;
    } catch (error) {
      document.documentElement.dataset.theme = "light";
    }
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-white text-[#151311]">
        <ThemeToggle />
        {children}
      </body>
    </html>
  );
}
