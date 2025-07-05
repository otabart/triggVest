import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts"

const performanceData = [
    { date: "Jan 1", portfolio: 100000, profit: 0 },
    { date: "Jan 8", portfolio: 105000, profit: 5000 },
    { date: "Jan 15", portfolio: 112000, profit: 12000 },
    { date: "Jan 22", portfolio: 108000, profit: 8000 },
    { date: "Jan 29", portfolio: 127450, profit: 27450 },
    { date: "Feb 5", portfolio: 134000, profit: 34000 },
    { date: "Feb 12", portfolio: 129000, profit: 29000 },
    { date: "Feb 19", portfolio: 142000, profit: 42000 },
]

const strategyPerformance = [
    { name: "Elon's DOGE Pump", profit: 23.4, volume: 12450, color: "#f7931a" },
    { name: "Trump Crypto Boost", profit: 31.8, volume: 8750, color: "#16a34a" },
    { name: "Vitalik's ETH Vision", profit: 19.6, volume: 15670, color: "#627eea" },
    { name: "Whale Alert Follower", profit: 15.2, volume: 9230, color: "#8b5cf6" },
    { name: "Fed Rate Hedge", profit: 8.7, volume: 5430, color: "#06b6d4" },
    { name: "SEC Crackdown Alert", profit: -2.1, volume: 3200, color: "#dc2626" },
]

export function PerformanceCharts() {
    return (
        <>
            <div className="section-separator"></div>
            <section className="py-20 md:py-28 bg-background">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-5xl md:text-6xl font-bold font-sans text-foreground">Battle Analytics</h2>
                        <p className="mt-4 text-lg text-muted-foreground">Deep insights into your trading performance.</p>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-8">
                        {/* Portfolio Growth */}
                        <Card className="rounded-none border-4 border-black">
                            <CardHeader>
                                <h3 className="text-2xl font-bold font-sans text-foreground">Portfolio Growth</h3>
                                <p className="text-muted-foreground">Total portfolio value over time</p>
                            </CardHeader>
                            <CardContent>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={performanceData}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#000" opacity={0.3} />
                                            <XAxis dataKey="date" stroke="#000" fontWeight="bold" />
                                            <YAxis stroke="#000" fontWeight="bold" />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: "#fff",
                                                    border: "4px solid #000",
                                                    borderRadius: "0",
                                                    fontWeight: "bold",
                                                }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="portfolio"
                                                stroke="#16a34a"
                                                strokeWidth={3}
                                                fill="#16a34a"
                                                fillOpacity={0.2}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Strategy Performance */}
                        <Card className="rounded-none border-4 border-black">
                            <CardHeader>
                                <h3 className="text-2xl font-bold font-sans text-foreground">Strategy Performance</h3>
                                <p className="text-muted-foreground">Individual strategy returns and volumes</p>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {strategyPerformance.map((strategy, index) => (
                                        <div key={index} className="p-4 bg-secondary border-2 border-black">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="font-bold text-foreground">{strategy.name}</div>
                                                <div
                                                    className={`font-bold font-sans text-lg ${strategy.profit > 0 ? "text-green-600" : "text-red-600"
                                                        }`}
                                                >
                                                    {strategy.profit > 0 ? "+" : ""}
                                                    {strategy.profit}%
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <div className="text-muted-foreground">Volume: ${strategy.volume.toLocaleString()}</div>
                                                <div className="w-24 h-2 bg-background border-2 border-black">
                                                    <div
                                                        className="h-full"
                                                        style={{
                                                            backgroundColor: strategy.color,
                                                            width: `${Math.abs(strategy.profit) * 2}%`,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>
        </>
    )
}
