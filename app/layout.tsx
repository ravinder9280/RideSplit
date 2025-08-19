import type { Metadata } from "next";
import {Outfit} from 'next/font/google'
import "./globals.css";
import Navbar from "@/components/Navbar";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from '@clerk/themes'
const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',     // avoids invisible text flash
  weight: ['400', '500', '600', '700'], // load only what you need
})

export const metadata: Metadata = {
  title: "Ride Split",
  description: "Ride Split is a platform for splitting rides",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider appearance={{
      baseTheme:dark
    }}>

    <html lang="en">
      <link rel="icon"  href="/logo.png" type="image/jpg"  sizes="any" />
      <body
        className={`${outfit.variable} antialiased dark`}
      >
        <>
          <Navbar/>
        {children}
        </>
      </body>
    </html>
    </ClerkProvider>
  );
}
