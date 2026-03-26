import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import StoreHydration from "./components/StoreHydration";
import ToastContainer from "./components/ToastContainer";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Inbox — Chat App",
  description: "Real-time chat application",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="h-full bg-[#111111] text-white">
        {/* Rehydrates persisted auth from localStorage on first client render */}
        <StoreHydration />
        {children}
        {/* Global toast notifications */}
        <ToastContainer />
      </body>
    </html>
  );
}
