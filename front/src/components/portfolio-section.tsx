import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts"

const portfolioData = [
    { name: "Bitcoin", value: 45, amount: "$57,352", color: "#f7931a" },
    { name: "Ethereum", value: 25, amount: "$31,862", color: "#627eea" },
    { name: "DOGE", value: 15, amount: "$19,117", color: "#c2a633" },
    { name: "Others", value: 15, amount: "$19,119", color: "#8b5cf6" },
]

const performanceData = [
    { month: "Jan", profit: 2400, loss: 400 },
    { month: "Feb", profit: 1398, loss: 300 },
    { month: "Mar", profit: 9800, loss: 200 },
    { month: "Apr", profit: 3908, loss: 278 },
    { month: "May", profit: 4800, loss: 189 },
    { month: "Jun", profit: 3800, loss: 239 },
]

export function PortfolioSection() {
    return (
        <>
            <div className="section-separator"></div>
            <section className="py-20 md:py-28 bg-secondary">
                <div className="container mx-auto px-4 md:px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-5xl md:text-6xl font-bold font-sans text-foreground">Portfolio Arsenal</h2>
                        <p className="mt-4 text-lg text-muted-foreground">Your crypto holdings and performance breakdown.</p>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-8">
                        {/* Portfolio Allocation */}
                        <Card className="rounded-none border-4 border-black">
                            <CardHeader>
                                <h3 className="text-2xl font-bold font-sans text-foreground">Asset Allocation</h3>
                            </CardHeader>
                            <CardContent>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={portfolioData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={120}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {portfolioData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#000" strokeWidth={2} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: "#fff",
                                                    border: "4px solid #000",
                                                    borderRadius: "0",
                                                    fontWeight: "bold",
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="grid grid-cols-2 gap-4 mt-6">
                                    {portfolioData.map((item, index) => (
                                        <div key={index} className="flex items-center gap-3">
                                            <div className="w-4 h-4 border-2 border-black" style={{ backgroundColor: item.color }}></div>
                                            <div>
                                                <div className="font-bold text-foreground">{item.name}</div>
                                                <div className="text-sm text-muted-foreground">
                                                    {item.value}% • {item.amount}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Performance Chart */}
                        <Card className="rounded-none border-4 border-black">
                            <CardHeader>
                                <h3 className="text-2xl font-bold font-sans text-foreground">Monthly Performance</h3>
                            </CardHeader>
                            <CardContent>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={performanceData}>
                                            <XAxis dataKey="month" stroke="#000" fontWeight="bold" />
                                            <YAxis stroke="#000" fontWeight="bold" />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: "#fff",
                                                    border: "4px solid #000",
                                                    borderRadius: "0",
                                                    fontWeight: "bold",
                                                }}
                                            />
                                            <Bar dataKey="profit" fill="#16a34a" stroke="#000" strokeWidth={2} />
                                            <Bar dataKey="loss" fill="#dc2626" stroke="#000" strokeWidth={2} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="flex justify-center gap-6 mt-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-green-600 border-2 border-black"></div>
                                        <span className="font-bold text-foreground">Profit</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-red-600 border-2 border-black"></div>
                                        <span className="font-bold text-foreground">Loss</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </section>
        </>
    )
}
