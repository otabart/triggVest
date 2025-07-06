"use client"

import { useAccount } from "wagmi"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { ConnectWalletModal } from "./connect-wallet-modal"

interface RouteGuardProps {
    children: React.ReactNode
}

const PUBLIC_ROUTES = ["/", "/home"]

export function RouteGuard({ children }: RouteGuardProps) {
    const { isConnected, address } = useAccount()
    const pathname = usePathname()
    const router = useRouter()
    const [showModal, setShowModal] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // Vérifier si la route actuelle est publique
        const isPublicRoute = PUBLIC_ROUTES.includes(pathname)

        console.log('RouteGuard Debug:', {
            pathname,
            isConnected,
            address,
            isPublicRoute,
            shouldShowModal: !isConnected && !isPublicRoute
        })

        if (!isConnected && !isPublicRoute) {
            console.log('Showing modal - user not connected and trying to access protected route')
            setShowModal(true)
        } else {
            console.log('Hiding modal - user connected or accessing public route')
            setShowModal(false)
        }

        setIsLoading(false)
    }, [isConnected, pathname, address])

    const handleConnectSuccess = () => {
        setShowModal(false)
        // Rediriger vers la page demandée après connexion
        if (!PUBLIC_ROUTES.includes(pathname)) {
            // La redirection se fera automatiquement grâce au useEffect
        }
    }

    const handleGoHome = () => {
        router.push("/")
        setShowModal(false)
    }

    if (isLoading) {
        return <div className="min-h-screen bg-background" />
    }

    return (
        <>
            {children}
            {showModal && (
                <ConnectWalletModal
                    onConnectSuccess={handleConnectSuccess}
                    onGoHome={handleGoHome}
                />
            )}
        </>
    )
} 