"use client"

import { Button } from "@/components/ui/button"
import { Wallet } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useAccount, useDisconnect } from "wagmi"
import { useAppKit } from "@reown/appkit/react"

export function Header() {
    const { address, isConnected } = useAccount()
    const { disconnect } = useDisconnect()
    const { open } = useAppKit()

    const handleConnect = () => {
        if (isConnected) {
            disconnect()
        } else {
            open()
        }
    }

    return (
        <header className="sticky top-0 z-50 w-full border-b-4 border-black bg-background/90 backdrop-blur-sm">
            <div className="container mx-auto flex h-20 items-center justify-between px-4 md:px-6">
                <Link href="/" className="flex items-center gap-3 group">
                    <div className="relative">
                        <Image src="/triggvest-logo.png" alt="Triggvest Logo" width={48} height={48} className="rounded-full" />
                    </div>
                    <span className="text-3xl font-bold font-sans text-foreground">Triggvest</span>
                </Link>
                <nav className="hidden items-center gap-8 text-base md:flex">
                    <Link
                        href="/strategy"
                        className="relative transition-colors hover:text-accent after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-accent after:transition-all after:duration-300 hover:after:w-full"
                    >
                        My Strategies
                    </Link>
                    <Link
                        href="/strategy/new"
                        className="relative transition-colors hover:text-accent after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-accent after:transition-all after:duration-300 hover:after:w-full"
                    >
                        New Strategy
                    </Link>
                </nav>
                <Button
                    onClick={handleConnect}
                    variant="default"
                    className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold rounded-none px-6 py-3 border-4 border-black transition-all duration-200 hover:translate-x-1 hover:translate-y-1 active:translate-x-0 active:translate-y-0"
                >
                    <Wallet className="w-4 h-4 mr-2" />
                    {isConnected ? (
                        <span className="flex items-center gap-2">
                            {address?.slice(0, 6)}...{address?.slice(-4)}
                            <span className="text-xs">Disconnect</span>
                        </span>
                    ) : (
                        "Connect Wallet"
                    )}
                </Button>
            </div>
        </header>
    )
}
