"use client"

import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, Wallet, Zap, DollarSign, Target, Activity } from "lucide-react"
import { useState, useEffect } from "react"

interface DashboardStats {
    totalStrategies: number
    activeStrategies: number
    totalExecutions: number
    totalUsers: number
    totalWallets: number
    recentExecutions: number
}

export function DashboardOverview() {
    const [stats, setStats] = useState<DashboardStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchDashboardStats = async () => {
            try {
                setLoading(true)
                const response = await fetch(`${process.env.NEXT_PUBLIC_STRATEGY_ROUTER_API}api/dashboard-stats`)
                
                if (!response.ok) {
                    throw new Error('Failed to fetch dashboard stats')
                }
                
                const data = await response.json()
                
                if (data.success) {
                    setStats(data.stats)
                } else {
                    throw new Error(data.message || 'Failed to fetch stats')
                }
            } catch (err) {
                console.error('Error fetching dashboard stats:', err)
                setError('Failed to load dashboard statistics')
            } finally {
                setLoading(false)
            }
        }

        fetchDashboardStats()
    }, [])

    // Calculer les statistiques dynamiques
    const getOverviewStats = (stats: DashboardStats) => [
        {
            icon: Target,
            label: "Total Strategies",
            value: stats.totalStrategies.toString(),
            change: `${stats.activeStrategies} active`,
            positive: stats.activeStrategies > 0,
        },
        {
            icon: Activity,
            label: "Total Executions",
            value: stats.totalExecutions.toString(),
            change: `${stats.recentExecutions} recent`,
            positive: stats.recentExecutions > 0,
        },
        {
            icon: TrendingUp,
            label: "Platform Activity",
            value: stats.totalUsers > 1 ? "Active" : "Starting",
            change: `${stats.totalUsers} users`,
            positive: stats.totalUsers > 0,
        },
        {
            icon: Wallet,
            label: "Strategy Wallets",
            value: stats.totalWallets.toString(),
            change: "All generated",
            positive: stats.totalWallets > 0,
        },
        {
            icon: Zap,
            label: "Triggers Ready",
            value: stats.activeStrategies.toString(),
            change: "Monitoring",
            positive: stats.activeStrategies > 0,
        },
        {
            icon: DollarSign,
            label: "System Status",
            value: stats.totalStrategies > 0 ? "Operational" : "Standby",
            change: "All systems go",
            positive: true,
        },
    ]

    if (loading) {
        return (
            <section className="py-20 md:py-28 bg-background">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="text-center mb-16">
                        <h1 className="text-5xl md:text-6xl font-bold font-sans text-foreground">Command Center</h1>
                        <p className="mt-4 text-lg text-muted-foreground">Loading battle statistics...</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <Card key={index} className="rounded-none border-4 border-black animate-pulse">
                                <CardContent className="p-6">
                                    <div className="h-24 bg-gray-200 rounded"></div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </section>
        )
    }

    if (error || !stats) {
        return (
            <section className="py-20 md:py-28 bg-background">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="text-center mb-16">
                        <h1 className="text-5xl md:text-6xl font-bold font-sans text-foreground">Command Center Offline</h1>
                        <p className="mt-4 text-lg text-muted-foreground">Unable to load battle statistics.</p>
                    </div>
                </div>
            </section>
        )
    }

    const overviewStats = getOverviewStats(stats)
    return (
        <section className="py-20 md:py-28 bg-background">
            <div className="container mx-auto px-4 md:px-6">
                <div className="text-center mb-16">
                    <h1 className="text-5xl md:text-6xl font-bold font-sans text-foreground">Command Center</h1>
                    <p className="mt-4 text-lg text-muted-foreground">Your complete arsenal overview and battle statistics.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {overviewStats.map((stat, index) => (
                        <Card
                            key={index}
                            className="rounded-none border-4 border-black transition-all duration-300 hover:translate-x-2 hover:translate-y-2"
                        >
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="bg-accent/20 p-3 rounded-none border-2 border-black">
                                        <stat.icon className="w-6 h-6 text-accent" />
                                    </div>
                                    <div className={`text-sm font-bold ${stat.positive ? "text-green-600" : "text-red-600"}`}>
                                        {stat.change}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="text-3xl font-bold font-sans text-foreground">{stat.value}</div>
                                    <div className="text-sm font-bold text-muted-foreground">{stat.label}</div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    )
}
