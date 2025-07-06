import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, Wallet, Zap, DollarSign, Target, Activity } from "lucide-react"

const overviewStats = [
    {
        icon: DollarSign,
        label: "Total Portfolio Value",
        value: "$127,450",
        change: "+15.3%",
        positive: true,
    },
    {
        icon: Activity,
        label: "Total Transactions",
        value: "1,247",
        change: "+23 today",
        positive: true,
    },
    {
        icon: TrendingUp,
        label: "Trading Volume (24h)",
        value: "$45,892",
        change: "+8.7%",
        positive: true,
    },
    {
        icon: Target,
        label: "Active Strategies",
        value: "24",
        change: "+3 this week",
        positive: true,
    },
    {
        icon: Zap,
        label: "Triggers Fired",
        value: "156",
        change: "+12 today",
        positive: true,
    },
    {
        icon: Wallet,
        label: "Connected Wallets",
        value: "24",
        change: "All active",
        positive: true,
    },
]

export function DashboardOverview() {
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
