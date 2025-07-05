import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Play, Pause, Settings, MoreVertical } from "lucide-react"
import { MiniChart } from "@/components/mini-chart"

interface Strategy {
    id: number
    name: string
    description: string
    trigger: string
    action: string
    status: "active" | "paused" | "inactive"
    performance: string
    lastTriggered: string
    totalTriggers: number
    icon: any
    chart: number[]
}

interface StrategyCardProps {
    strategy: Strategy
}

export function StrategyCard({ strategy }: StrategyCardProps) {
    const isPositive = strategy.performance.startsWith("+")
    const isActive = strategy.status === "active"

    return (
        <Card className="rounded-none border-4 border-black transition-all duration-300 hover:translate-x-2 hover:translate-y-2 bg-card">
            <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-accent/20 p-3 rounded-none border-2 border-black">
                            <strategy.icon className="w-6 h-6 text-accent" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold font-sans text-foreground">{strategy.name}</h3>
                            <div
                                className={`flex items-center gap-1 text-sm font-bold ${isActive ? "text-green-600" : "text-yellow-600"
                                    }`}
                            >
                                <div className={`w-2 h-2 rounded-full ${isActive ? "bg-green-500" : "bg-yellow-500"}`} />
                                {strategy.status.toUpperCase()}
                            </div>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" className="p-2">
                        <MoreVertical className="w-4 h-4" />
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                <p className="text-muted-foreground text-sm leading-relaxed">{strategy.description}</p>

                <div className="space-y-3">
                    <div>
                        <div className="text-xs font-bold text-accent mb-1">TRIGGER</div>
                        <div className="text-sm bg-secondary p-2 rounded-none border-2 border-black">{strategy.trigger}</div>
                    </div>

                    <div>
                        <div className="text-xs font-bold text-accent mb-1">ACTION</div>
                        <div className="text-sm bg-secondary p-2 rounded-none border-2 border-black">{strategy.action}</div>
                    </div>
                </div>

                <div className="h-16 bg-secondary rounded-none border-2 border-black p-2">
                    <MiniChart data={strategy.chart} positive={isPositive} />
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                        <div className={`text-lg font-bold font-sans ${isPositive ? "text-green-600" : "text-red-600"}`}>
                            {strategy.performance}
                        </div>
                        <div className="text-xs text-muted-foreground">Performance</div>
                    </div>
                    <div>
                        <div className="text-lg font-bold font-sans text-foreground">{strategy.totalTriggers}</div>
                        <div className="text-xs text-muted-foreground">Triggers</div>
                    </div>
                    <div>
                        <div className="text-lg font-bold font-sans text-foreground">{strategy.lastTriggered}</div>
                        <div className="text-xs text-muted-foreground">Last Fired</div>
                    </div>
                </div>

                <div className="flex gap-2 pt-2">
                    <Button
                        size="sm"
                        variant={isActive ? "outline" : "default"}
                        className="flex-1 rounded-none border-2 border-black font-bold"
                    >
                        {isActive ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
                        {isActive ? "Pause" : "Activate"}
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-none border-2 border-black bg-transparent">
                        <Settings className="w-4 h-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
