"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, ExternalLink, Eye, EyeOff } from "lucide-react"
import { useState } from "react"

const walletsData = [
    {
        id: "1",
        strategyName: "Elon's DOGE Pump",
        address: "0x742d35Cc6634C0532925a3b8D4C2C4e4C4C4C4C4",
        balance: "$12,450",
        transactions: 47,
        lastActivity: "2 hours ago",
        status: "active",
    },
    {
        id: "2",
        strategyName: "Fed Rate Hedge",
        address: "0x8f3CF7ad23Cd3CaDbD9735AFf958023239c6A063",
        balance: "$8,750",
        transactions: 23,
        lastActivity: "1 day ago",
        status: "active",
    },
    {
        id: "3",
        strategyName: "SEC Crackdown Alert",
        address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
        balance: "$5,230",
        transactions: 15,
        lastActivity: "3 days ago",
        status: "paused",
    },
    {
        id: "4",
        strategyName: "Whale Alert Follower",
        address: "0xA0b86a33E6441E6C7D3C4C4C4C4C4C4C4C4C4C4C",
        balance: "$15,670",
        transactions: 31,
        lastActivity: "6 hours ago",
        status: "active",
    },
]

export function WalletsSection() {
    const [hiddenAddresses, setHiddenAddresses] = useState<Set<string>>(new Set())

    const toggleAddressVisibility = (walletId: string) => {
        const newHidden = new Set(hiddenAddresses)
        if (newHidden.has(walletId)) {
            newHidden.delete(walletId)
        } else {
            newHidden.add(walletId)
        }
        setHiddenAddresses(newHidden)
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
    }

    const formatAddress = (address: string, isHidden: boolean) => {
        if (isHidden) {
            return "0x" + "•".repeat(36)
        }
        return `${address.slice(0, 6)}...${address.slice(-4)}`
    }

    return (
        <Card className="rounded-none border-4 border-black">
            <CardHeader>
                <h3 className="text-2xl font-bold font-sans text-foreground">Strategy Wallets</h3>
                <p className="text-muted-foreground">Each strategy has its own dedicated wallet for security.</p>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {walletsData.map((wallet) => (
                        <div
                            key={wallet.id}
                            className="p-4 bg-secondary border-4 border-black transition-all duration-200 hover:translate-x-1 hover:translate-y-1"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <div className="font-bold font-sans text-foreground text-lg">{wallet.strategyName}</div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <code className="text-sm bg-background px-2 py-1 border-2 border-black font-mono">
                                            {formatAddress(wallet.address, hiddenAddresses.has(wallet.id))}
                                        </code>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => toggleAddressVisibility(wallet.id)}
                                            className="p-1 h-6 w-6"
                                        >
                                            {hiddenAddresses.has(wallet.id) ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => copyToClipboard(wallet.address)}
                                            className="p-1 h-6 w-6"
                                        >
                                            <Copy className="w-3 h-3" />
                                        </Button>
                                        <Button size="sm" variant="ghost" className="p-1 h-6 w-6">
                                            <ExternalLink className="w-3 h-3" />
                                        </Button>
                                    </div>
                                </div>
                                <div
                                    className={`px-2 py-1 text-xs font-bold rounded-none border-2 border-black ${wallet.status === "active" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                                        }`}
                                >
                                    {wallet.status.toUpperCase()}
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                    <div className="text-muted-foreground">Balance</div>
                                    <div className="font-bold text-foreground">{wallet.balance}</div>
                                </div>
                                <div>
                                    <div className="text-muted-foreground">Transactions</div>
                                    <div className="font-bold text-foreground">{wallet.transactions}</div>
                                </div>
                                <div>
                                    <div className="text-muted-foreground">Last Activity</div>
                                    <div className="font-bold text-foreground">{wallet.lastActivity}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
