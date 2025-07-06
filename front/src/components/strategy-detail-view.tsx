"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { StrategyWorkflow } from "@/components/strategy-workflow"
import { StrategyStats } from "@/components/strategy-stats"
import { StrategyLogs } from "@/components/strategy-logs"
import { ArrowLeft, Play, Pause, Trash2, Edit3 } from "lucide-react"
import Link from "next/link"

// Mock data - in real app, this would come from API
const mockStrategy = {
    id: "1",
    name: "Elon's DOGE Pump",
    description: "Automatically buy DOGE when Elon tweets about Dogecoin",
    status: "active",
    performance: "+23.4%",
    totalVolume: "$12,450",
    successRate: "78%",
    lastTriggered: "2 hours ago",
    totalTriggers: 12,
    createdAt: "2024-01-15",
    workflow: {
        trigger: {
            type: "twitter",
            source: "@elonmusk",
            keywords: ["doge", "dogecoin", "moon"],
            description: "Monitor @elonmusk for mentions of 'doge', 'dogecoin', or 'moon'",
        },
        conditions: [
            {
                type: "sentiment",
                value: "positive",
                description: "Only trigger on positive sentiment tweets",
            },
        ],
        action: {
            type: "buy",
            amount: "$500",
            description: "Purchase $500 worth of DOGE",
        },
        target: {
            token: "DOGE",
            blockchain: "ethereum",
            exchange: "Uniswap",
            description: "Execute on Ethereum via Uniswap",
        },
    },
}

interface StrategyDetailViewProps {
    strategyId: string
}

export function StrategyDetailView({ strategyId }: StrategyDetailViewProps) {
    const [strategy] = useState(mockStrategy)
    const [isEditing, setIsEditing] = useState(false)
    const [activeTab, setActiveTab] = useState("workflow")

    const isActive = strategy.status === "active"

    return (
        <section className="py-20 md:py-28 bg-background min-h-screen">
            <div className="container mx-auto px-4 md:px-6 max-w-6xl">
                {/* Header */}
                <div className="mb-12">
                    <Link
                        href="/strategy"
                        className="inline-flex items-center gap-2 text-accent hover:text-accent/80 font-bold mb-6 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back to Arsenal
                    </Link>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-4 mb-2">
                                <h1 className="text-4xl md:text-5xl font-bold font-sans text-foreground">{strategy.name}</h1>
                                <div
                                    className={`flex items-center gap-1 px-3 py-1 rounded-none border-2 border-black text-sm font-bold ${isActive ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                                        }`}
                                >
                                    <div className={`w-2 h-2 rounded-full ${isActive ? "bg-green-500" : "bg-yellow-500"}`} />
                                    {strategy.status.toUpperCase()}
                                </div>
                            </div>
                            <p className="text-lg text-muted-foreground">{strategy.description}</p>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                onClick={() => setIsEditing(!isEditing)}
                                variant="outline"
                                className="font-bold px-4 py-2 rounded-none border-4 border-black bg-transparent"
                            >
                                <Edit3 className="w-4 h-4 mr-2" />
                                {isEditing ? "Cancel" : "Edit"}
                            </Button>
                            <Button
                                variant={isActive ? "outline" : "default"}
                                className={`font-bold px-4 py-2 rounded-none border-4 border-black ${isActive ? "bg-transparent" : "bg-accent text-accent-foreground hover:bg-accent/90"
                                    }`}
                            >
                                {isActive ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                                {isActive ? "Pause" : "Activate"}
                            </Button>
                            <Button
                                variant="outline"
                                className="font-bold px-4 py-2 rounded-none border-4 border-black bg-transparent text-red-600 hover:bg-red-50"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Stats Overview */}
                <StrategyStats strategy={strategy} />

                {/* Tabs */}
                <div className="mb-8">
                    <div className="flex gap-2 border-b-4 border-black">
                        {[
                            { id: "workflow", label: "Workflow" },
                            { id: "logs", label: "Activity Logs" },
                            { id: "settings", label: "Settings" },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-6 py-3 font-bold font-sans text-lg border-4 border-black border-b-0 transition-all duration-200 ${activeTab === tab.id
                                    ? "bg-accent text-accent-foreground translate-y-1"
                                    : "bg-secondary hover:bg-secondary/80"
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Tab Content */}
                {activeTab === "workflow" && <StrategyWorkflow workflow={strategy.workflow} isEditing={isEditing} />}

                {activeTab === "logs" && <StrategyLogs strategyId={strategy.id} />}

                {activeTab === "settings" && (
                    <Card className="rounded-none border-4 border-black">
                        <CardHeader>
                            <h3 className="text-2xl font-bold font-sans text-foreground">Strategy Settings</h3>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-lg font-bold text-foreground mb-2">Strategy Name</label>
                                    <input
                                        type="text"
                                        value={strategy.name}
                                        className="w-full p-3 border-4 border-black rounded-none bg-background text-foreground font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block text-lg font-bold text-foreground mb-2">Description</label>
                                    <textarea
                                        value={strategy.description}
                                        rows={3}
                                        className="w-full p-3 border-4 border-black rounded-none bg-background text-foreground resize-none"
                                    />
                                </div>
                                <Button className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold px-6 py-3 rounded-none border-4 border-black">
                                    Save Changes
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </section>
    )
}
