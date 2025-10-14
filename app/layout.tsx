import type { Metadata } from "next";
import {Outfit} from 'next/font/google'
import "./globals.css";
import Navbar from "@/components/Navbar";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from '@clerk/themes'
import { Toaster, } from 'sonner'
import { ThemeProvider } from "@/components/theme-provider"

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',     // avoids invisible text flash
  weight: ['400', '500', '600', '700'], // load only what you need
})

export const metadata: Metadata = {
  title: "RidePlus",
  description: "Ride Plus is a platform for splitting rides Fares",
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
        className={`${outfit.variable} antialiased  `}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
            
          >            
          <>
            <Toaster closeButton position="top-right" richColors={true} />
          <Navbar/>
              <main className="mt-[4rem] w-full sm:p-4 md:p-6 lg:p-8 p-2 ">

              {children}
              </main>        </>
        </ThemeProvider>
      </body>
    </html>
    </ClerkProvider>
  );
}
