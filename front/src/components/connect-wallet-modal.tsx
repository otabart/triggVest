"use client"

import { useAppKit } from "@reown/appkit/react"
import { useAccount } from "wagmi"
import { Button } from "@/components/ui/button"
import { Wallet, X, ArrowLeft } from "lucide-react"
import { useEffect } from "react"

interface ConnectWalletModalProps {
    onConnectSuccess: () => void
    onGoHome: () => void
}

export function ConnectWalletModal({ onConnectSuccess, onGoHome }: ConnectWalletModalProps) {
    const { open } = useAppKit()
    const { isConnected } = useAccount()

    const handleConnect = () => {
        open()
    }

    // Écouter les changements de connexion pour fermer la modal
    useEffect(() => {
        console.log('Modal Debug - isConnected:', isConnected)

        if (isConnected) {
            console.log('User connected, closing modal')
            onConnectSuccess()
        }
    }, [isConnected, onConnectSuccess])

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="relative bg-background border-4 border-black p-8 max-w-md w-full mx-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold font-sans text-foreground">Wallet Required</h2>
                    <button
                        onClick={onGoHome}
                        className="p-2 hover:bg-secondary transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-accent/20 border-4 border-black rounded-none flex items-center justify-center mx-auto mb-4">
                            <Wallet className="w-8 h-8 text-accent" />
                        </div>
                        <h3 className="text-xl font-bold font-sans text-foreground mb-2">
                            Connect Your Wallet
                        </h3>
                        <p className="text-muted-foreground leading-relaxed">
                            You need to connect your wallet to access this page.
                            Connect securely with your preferred wallet provider.
                        </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-3">
                        <Button
                            onClick={handleConnect}
                            size="lg"
                            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-lg px-8 py-4 rounded-none border-4 border-black transition-all duration-200 hover:translate-x-1 hover:translate-y-1 active:translate-x-0 active:translate-y-0"
                        >
                            <Wallet className="w-5 h-5 mr-2" />
                            Connect Wallet
                        </Button>

                        <Button
                            onClick={onGoHome}
                            variant="outline"
                            className="w-full font-bold px-8 py-4 rounded-none border-4 border-black bg-transparent hover:bg-secondary/50 transition-all duration-200"
                        >
                            <ArrowLeft className="w-5 h-5 mr-2" />
                            Back to Home
                        </Button>
                    </div>

                    {/* Info */}
                    <div className="bg-secondary/50 border-4 border-black p-4">
                        <p className="text-sm text-muted-foreground text-center">
                            <strong>Why connect?</strong> Your wallet is required to create and manage trading strategies securely.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
} 