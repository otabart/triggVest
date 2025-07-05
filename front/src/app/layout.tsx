import type React from "react"
import type { Metadata } from "next"
import { Inter, Luckiest_Guy } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"
import { SmoothCursor } from "@/components/ui/smooth-cursor"
import { headers } from 'next/headers'
import ContextProvider from '@/context'

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

const luckiestGuy = Luckiest_Guy({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  variable: "--font-luckiest-guy",
})

export const metadata: Metadata = {
  title: "Triggvest - Automate Your Crypto Trades",
  description: "You set the rules. We pull the trigger.",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {

  const headersObj = await headers();
  const cookies = headersObj.get('cookie')

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("font-sans", inter.variable, luckiestGuy.variable)}>
        <SmoothCursor />
        <ContextProvider cookies={cookies}>{children}</ContextProvider>
      </body>
    </html>
  )
}
