import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, DollarSign, Target, Clock } from "lucide-react"

interface StrategyStatsProps {
    strategy: {
        performance: string
        totalVolume: string
        successRate: string
        lastTriggered: string
        totalTriggers: number
    }
}

export function StrategyStats({ strategy }: StrategyStatsProps) {
    const stats = [
        {
            icon: TrendingUp,
            label: "Performance",
            value: strategy.performance,
            positive: strategy.performance.startsWith("+"),
        },
        {
            icon: DollarSign,
            label: "Total Volume",
            value: strategy.totalVolume,
            positive: true,
        },
        {
            icon: Target,
            label: "Success Rate",
            value: strategy.successRate,
            positive: true,
        },
        {
            icon: Clock,
            label: "Last Triggered",
            value: strategy.lastTriggered,
            positive: true,
        },
    ]

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {stats.map((stat, index) => (
                <Card
                    key={index}
                    className="rounded-none border-4 border-black transition-all duration-300 hover:translate-x-1 hover:translate-y-1"
                >
                    <CardContent className="p-6 text-center">
                        <div className="bg-accent/20 p-4 rounded-none border-2 border-black mx-auto w-fit mb-4">
                            <stat.icon className="w-6 h-6 text-accent" />
                        </div>
                        <div
                            className={`text-2xl font-bold font-sans mb-2 ${stat.positive ? "text-green-600" : "text-red-600"
                                }`}
                        >
                            {stat.value}
                        </div>
                        <div className="text-sm font-bold text-muted-foreground">{stat.label}</div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )
}
