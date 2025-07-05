import { StrategyCard } from "@/components/strategy-card"
import { Button } from "@/components/ui/button"
import { Target, TrendingUp, TrendingDown, Zap, Bot, Shield, Plus } from "lucide-react"

const strategies = [
    {
        id: 1,
        name: "Elon's DOGE Pump",
        description: "Automatically buy DOGE when Elon tweets about Dogecoin",
        trigger: "@elonmusk mentions 'doge' or 'dogecoin'",
        action: "Buy $500 DOGE",
        status: "active",
        performance: "+23.4%",
        lastTriggered: "2 hours ago",
        totalTriggers: 12,
        icon: Target,
        chart: [65, 78, 82, 95, 88, 92, 105, 98, 112, 108, 125, 118],
    },
    {
        id: 2,
        name: "Fed Rate Hedge",
        description: "Sell risky assets when Fed announces rate hikes",
        trigger: "@federalreserve mentions 'rate increase'",
        action: "Sell 50% portfolio",
        status: "active",
        performance: "+8.7%",
        lastTriggered: "1 day ago",
        totalTriggers: 3,
        icon: Shield,
        chart: [100, 95, 88, 92, 85, 90, 87, 93, 89, 95, 91, 97],
    },
    {
        id: 3,
        name: "SEC Crackdown Alert",
        description: "Exit positions when SEC announces enforcement actions",
        trigger: "@SECGov mentions 'enforcement' or 'violation'",
        action: "Sell all altcoins",
        status: "paused",
        performance: "-2.1%",
        lastTriggered: "3 days ago",
        totalTriggers: 8,
        icon: TrendingDown,
        chart: [100, 98, 95, 92, 88, 85, 82, 79, 85, 88, 92, 95],
    },
    {
        id: 4,
        name: "Whale Alert Follower",
        description: "Mirror large Bitcoin transactions from known whales",
        trigger: "Whale wallet moves >1000 BTC",
        action: "Buy $1000 BTC",
        status: "active",
        performance: "+15.2%",
        lastTriggered: "6 hours ago",
        totalTriggers: 7,
        icon: TrendingUp,
        chart: [80, 85, 92, 88, 95, 102, 98, 105, 112, 108, 115, 120],
    },
    {
        id: 5,
        name: "Trump Crypto Boost",
        description: "Buy crypto when Trump posts positively about Bitcoin",
        trigger: "@realDonaldTrump mentions 'bitcoin' positively",
        action: "Buy $750 BTC",
        status: "active",
        performance: "+31.8%",
        lastTriggered: "12 hours ago",
        totalTriggers: 5,
        icon: Zap,
        chart: [70, 75, 82, 88, 95, 102, 108, 115, 122, 118, 125, 132],
    },
    {
        id: 6,
        name: "Vitalik's ETH Vision",
        description: "Accumulate ETH when Vitalik discusses major upgrades",
        trigger: "@VitalikButerin mentions 'upgrade' or 'ethereum'",
        action: "Buy $600 ETH",
        status: "active",
        performance: "+19.6%",
        lastTriggered: "1 day ago",
        totalTriggers: 9,
        icon: Bot,
        chart: [85, 88, 92, 95, 98, 102, 105, 108, 112, 115, 118, 122],
    },
]

export function StrategiesGridSection() {
    return (
        <section className="py-20 md:py-28 bg-background">
            <div className="container mx-auto px-4 md:px-6">
                <div className="text-center mb-16">
                    <h2 className="text-5xl md:text-6xl font-bold font-sans text-foreground">Your Strategy Arsenal</h2>
                    <p className="mt-4 text-lg text-muted-foreground mb-8">
                        Each strategy is locked, loaded, and ready to fire when conditions are met.
                    </p>
                    <Button
                        size="lg"
                        className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold text-lg px-8 py-6 rounded-none border-4 border-black transition-all duration-200 hover:translate-x-2 hover:translate-y-2 active:translate-x-0 active:translate-y-0"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Create New Strategy
                    </Button>
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
