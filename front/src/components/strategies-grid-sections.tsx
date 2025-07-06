"use client"

import { StrategyCard } from "@/components/strategy-card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"

interface ApiStrategy {
    id: string
    userId: string
    strategyName: string
    generatedAddress: string
    triggers: Array<{
        type: string
        account?: string
        keywords: string[]
    }>
    actions: Array<{
        type: string
        targetAsset: string
        targetChain: string
    }>
}

interface Strategy {
    id: string  // Changé de number à string pour utiliser les vrais IDs
    name: string
    description: string
    trigger: string
    action: string
    status: "active" | "paused" | "inactive"
    performance: string
    lastTriggered: string
    totalTriggers: number
    icon: string
    chart: number[]
}

// Fonction pour convertir les données API en format attendu par StrategyCard
function convertApiStrategyToCardStrategy(apiStrategy: ApiStrategy, index: number): Strategy {
    const trigger = apiStrategy.triggers[0]
    const action = apiStrategy.actions[0]
    
    // Générer des données aléatoires mais cohérentes pour la démo
    const performances = ["+23.4%", "+8.7%", "-2.1%", "+15.2%", "+31.8%", "+19.6%"]
    const lastTriggeredOptions = ["2 hours ago", "1 day ago", "3 days ago", "6 hours ago", "12 hours ago", "1 day ago"]
    const icons = ["target", "shield", "trending-down", "trending-up", "zap", "bot"]
    const chartData = [
        [65, 78, 82, 95, 88, 92, 105, 98, 112, 108, 125, 118],
        [100, 95, 88, 92, 85, 90, 87, 93, 89, 95, 91, 97],
        [80, 85, 92, 88, 95, 102, 98, 105, 112, 108, 115, 120]
    ]
    
    return {
        id: apiStrategy.id, // Utiliser le vrai ID de la base de données
        name: apiStrategy.strategyName,
        description: `Automated ${action.type} strategy for ${action.targetAsset} triggered by ${trigger.account}`,
        trigger: `${trigger.account} mentions ${trigger.keywords.map(k => `'${k}'`).join(' or ')}`,
        action: `${action.type.charAt(0).toUpperCase() + action.type.slice(1)} ${action.targetAsset} on ${action.targetChain}`,
        status: "active" as const,
        performance: performances[index % performances.length],
        lastTriggered: lastTriggeredOptions[index % lastTriggeredOptions.length],
        totalTriggers: Math.floor(Math.random() * 20) + 1,
        icon: icons[index % icons.length],
        chart: chartData[index % chartData.length],
    }
}

export function StrategiesGridSection() {
    const [strategies, setStrategies] = useState<Strategy[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchStrategies = async () => {
            try {
                setLoading(true)
                const response = await fetch(`${process.env.NEXT_PUBLIC_STRATEGY_ROUTER_API}api/strategies`)
                
                if (!response.ok) {
                    throw new Error('Failed to fetch strategies')
                }
                
                const data = await response.json()
                
                if (data.success && data.strategies) {
                    const convertedStrategies = data.strategies.map((apiStrategy: ApiStrategy, index: number) => 
                        convertApiStrategyToCardStrategy(apiStrategy, index)
                    )
                    setStrategies(convertedStrategies)
                } else {
                    setStrategies([])
                }
            } catch (err) {
                console.error('Error fetching strategies:', err)
                setError('Failed to load strategies')
            } finally {
                setLoading(false)
            }
        }

        fetchStrategies()
    }, [])

    if (loading) {
        return (
            <section className="py-20 md:py-28 bg-background">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="text-center">
                        <h2 className="text-5xl md:text-6xl font-bold font-sans text-foreground">Loading Arsenal...</h2>
                        <p className="mt-4 text-lg text-muted-foreground">
                            Fetching your strategies from the battlefield.
                        </p>
                    </div>
                </div>
            </section>
        )
    }

    if (error) {
        return (
            <section className="py-20 md:py-28 bg-background">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="text-center">
                        <h2 className="text-5xl md:text-6xl font-bold font-sans text-foreground">Arsenal Offline</h2>
                        <p className="mt-4 text-lg text-muted-foreground mb-8">
                            Failed to connect to strategy command center. Check your connection.
                        </p>
                        <Button onClick={() => window.location.reload()}>
                            Retry Connection
                        </Button>
                    </div>
                </div>
            </section>
        )
    }
    return (
        <section className="py-20 md:py-28 bg-background">
            <div className="container mx-auto px-4 md:px-6">
                <div className="text-center mb-16">
                    <h2 className="text-5xl md:text-6xl font-bold font-sans text-foreground">Your Strategy Arsenal</h2>
                    <p className="mt-4 text-lg text-muted-foreground mb-8">
                        Each strategy is locked, loaded, and ready to fire when conditions are met.
                    </p>
                    <Link href="/strategy/new">
                        <Button
                            size="lg"
                            className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-lg px-8 py-6 rounded-none border-4 border-black transition-all duration-200 hover:translate-x-2 hover:translate-y-2 active:translate-x-0 active:translate-y-0"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Create New Strategy
                        </Button>
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {strategies.map((strategy) => (
                        <StrategyCard key={strategy.id} strategy={strategy} />
                    ))}
                </div>
            </div>
        </section>
    )
}
