"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Target, Settings, Crosshair, Sparkles, Save, Eye } from "lucide-react"
import Link from "next/link"

const triggerSources = [
    { id: "twitter", name: "Twitter/X Account", icon: "🐦" },
    { id: "news", name: "News Outlet", icon: "📰" },
    { id: "price", name: "Price Movement", icon: "📈" },
    { id: "whale", name: "Whale Alert", icon: "🐋" },
]

const actions = [
    { id: "buy", name: "Buy", description: "Purchase a specific token" },
    { id: "sell", name: "Sell", description: "Sell a specific token" },
    { id: "swap", name: "Swap", description: "Exchange one token for another" },
    { id: "stop", name: "Stop Loss", description: "Sell when price drops" },
]

const blockchains = [
    { id: "ethereum", name: "Ethereum", symbol: "ETH" },
    { id: "bsc", name: "Binance Smart Chain", symbol: "BNB" },
    { id: "polygon", name: "Polygon", symbol: "MATIC" },
    { id: "arbitrum", name: "Arbitrum", symbol: "ARB" },
]

export function CreateStrategyForm() {
    const [currentStep, setCurrentStep] = useState(1)
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        triggerType: "",
        triggerSource: "",
        triggerKeywords: "",
        actionType: "",
        tokenSymbol: "",
        amount: "",
        blockchain: "",
    })

    const steps = [
        { number: 1, title: "Pick a Trigger", icon: Target },
        { number: 2, title: "Define an Action", icon: Settings },
        { number: 3, title: "Set Your Target", icon: Crosshair },
        { number: 4, title: "Review & Deploy", icon: Sparkles },
    ]

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }

    const nextStep = () => {
        if (currentStep < 4) setCurrentStep(currentStep + 1)
    }

    const prevStep = () => {
        if (currentStep > 1) setCurrentStep(currentStep - 1)
    }

    return (
        <section className="py-20 md:py-28 bg-background min-h-screen">
            <div className="container mx-auto px-4 md:px-6 max-w-4xl">
                {/* Header */}
                <div className="text-center mb-16">
                    <Link
                        href="/strategy"
                        className="inline-flex items-center gap-2 text-accent hover:text-accent/80 font-bold mb-6 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back to Arsenal
                    </Link>
                    <h1 className="text-5xl md:text-6xl font-bold font-sans text-foreground">Create New Strategy</h1>
                    <p className="mt-4 text-lg text-muted-foreground">
                        Lock and load your next automated trading strategy in 4 simple steps.
                    </p>
                </div>

                {/* Progress Steps */}
                <div className="mb-12">
                    <div className="flex justify-center items-center gap-4 mb-8">
                        {steps.map((step, index) => (
                            <div key={step.number} className="flex items-center">
                                <div
                                    className={`flex items-center justify-center w-12 h-12 rounded-none border-4 border-black font-bold font-sans transition-all duration-300 ${currentStep >= step.number
                                        ? "bg-accent text-accent-foreground"
                                        : "bg-secondary text-muted-foreground"
                                        }`}
                                >
                                    {step.number}
                                </div>
                                {index < steps.length - 1 && (
                                    <div className={`w-16 h-1 mx-2 ${currentStep > step.number ? "bg-accent" : "bg-secondary"}`} />
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="text-center">
                        <h2 className="text-2xl font-bold font-sans text-foreground">{steps[currentStep - 1].title}</h2>
                    </div>
                </div>

                {/* Form Steps */}
                <Card className="rounded-none border-4 border-black">
                    <CardContent className="p-8">
                        {/* Step 1: Pick a Trigger */}
                        {currentStep === 1 && (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-lg font-bold font-sans text-foreground mb-4">
                                        Strategy Name
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => handleInputChange("name", e.target.value)}
                                        placeholder="e.g., Elon's DOGE Pump"
                                        className="w-full p-4 border-4 border-black rounded-none bg-background text-foreground font-bold text-lg focus:outline-none focus:ring-2 focus:ring-accent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-lg font-bold font-sans text-foreground mb-4">Description</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => handleInputChange("description", e.target.value)}
                                        placeholder="Describe what this strategy does..."
                                        rows={3}
                                        className="w-full p-4 border-4 border-black rounded-none bg-background text-foreground font-bold resize-none focus:outline-none focus:ring-2 focus:ring-accent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-lg font-bold font-sans text-foreground mb-4">
                                        Trigger Source
                                    </label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {triggerSources.map((source) => (
                                            <div
                                                key={source.id}
                                                onClick={() => handleInputChange("triggerType", source.id)}
                                                className={`p-4 border-4 border-black cursor-pointer transition-all duration-200 hover:translate-x-1 hover:translate-y-1 ${formData.triggerType === source.id
                                                    ? "bg-accent text-accent-foreground"
                                                    : "bg-secondary hover:bg-secondary/80"
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="text-2xl">{source.icon}</span>
                                                    <span className="font-bold">{source.name}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {formData.triggerType === "twitter" && (
                                    <div>
                                        <label className="block text-lg font-bold font-sans text-foreground mb-4">
                                            Twitter Handle
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.triggerSource}
                                            onChange={(e) => handleInputChange("triggerSource", e.target.value)}
                                            placeholder="@elonmusk"
                                            className="w-full p-4 border-4 border-black rounded-none bg-background text-foreground font-bold text-lg focus:outline-none focus:ring-2 focus:ring-accent"
                                        />
                                    </div>
                                )}

                                {formData.triggerType && (
                                    <div>
                                        <label className="block text-lg font-bold font-sans text-foreground mb-4">
                                            Keywords to Monitor
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.triggerKeywords}
                                            onChange={(e) => handleInputChange("triggerKeywords", e.target.value)}
                                            placeholder="doge, dogecoin, moon"
                                            className="w-full p-4 border-4 border-black rounded-none bg-background text-foreground font-bold text-lg focus:outline-none focus:ring-2 focus:ring-accent"
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 2: Define an Action */}
                        {currentStep === 2 && (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-lg font-bold font-sans text-foreground mb-4">Action Type</label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {actions.map((action) => (
                                            <div
                                                key={action.id}
                                                onClick={() => handleInputChange("actionType", action.id)}
                                                className={`p-4 border-4 border-black cursor-pointer transition-all duration-200 hover:translate-x-1 hover:translate-y-1 ${formData.actionType === action.id
                                                    ? "bg-accent text-accent-foreground"
                                                    : "bg-secondary hover:bg-secondary/80"
                                                    }`}
                                            >
                                                <div className="text-center">
                                                    <div className="font-bold font-sans text-xl mb-2">{action.name}</div>
                                                    <div className="text-sm">{action.description}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-lg font-bold font-sans text-foreground mb-4">Amount (USD)</label>
                                    <input
                                        type="number"
                                        value={formData.amount}
                                        onChange={(e) => handleInputChange("amount", e.target.value)}
                                        placeholder="500"
                                        className="w-full p-4 border-4 border-black rounded-none bg-background text-foreground font-bold text-lg focus:outline-none focus:ring-2 focus:ring-accent"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Step 3: Set Your Target */}
                        {currentStep === 3 && (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-lg font-bold font-sans text-foreground mb-4">Token Symbol</label>
                                    <input
                                        type="text"
                                        value={formData.tokenSymbol}
                                        onChange={(e) => handleInputChange("tokenSymbol", e.target.value)}
                                        placeholder="DOGE"
                                        className="w-full p-4 border-4 border-black rounded-none bg-background text-foreground font-bold text-lg focus:outline-none focus:ring-2 focus:ring-accent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-lg font-bold font-sans text-foreground mb-4">Blockchain</label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {blockchains.map((blockchain) => (
                                            <div
                                                key={blockchain.id}
                                                onClick={() => handleInputChange("blockchain", blockchain.id)}
                                                className={`p-4 border-4 border-black cursor-pointer transition-all duration-200 hover:translate-x-1 hover:translate-y-1 ${formData.blockchain === blockchain.id
                                                    ? "bg-accent text-accent-foreground"
                                                    : "bg-secondary hover:bg-secondary/80"
                                                    }`}
                                            >
                                                <div className="text-center">
                                                    <div className="font-bold font-sans text-xl">{blockchain.name}</div>
                                                    <div className="text-sm">{blockchain.symbol}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 4: Review & Deploy */}
                        {currentStep === 4 && (
                            <div className="space-y-6">
                                <div className="bg-secondary p-6 border-4 border-black">
                                    <h3 className="text-2xl font-bold font-sans text-foreground mb-4">Strategy Summary</h3>
                                    <div className="space-y-3">
                                        <div>
                                            <strong>Name:</strong> {formData.name}
                                        </div>
                                        <div>
                                            <strong>Description:</strong> {formData.description}
                                        </div>
                                        <div>
                                            <strong>Trigger:</strong> {formData.triggerSource} mentions "{formData.triggerKeywords}"
                                        </div>
                                        <div>
                                            <strong>Action:</strong> {formData.actionType} ${formData.amount} of {formData.tokenSymbol}
                                        </div>
                                        <div>
                                            <strong>Blockchain:</strong> {blockchains.find((b) => b.id === formData.blockchain)?.name}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-yellow-100 border-4 border-black p-4">
                                    <div className="flex items-start gap-3">
                                        <span className="text-2xl">⚠️</span>
                                        <div>
                                            <div className="font-bold text-yellow-800">Important Notice</div>
                                            <div className="text-yellow-700 text-sm">
                                                This strategy will execute automatically when conditions are met. Make sure you have sufficient
                                                funds in your connected wallet.
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex justify-between mt-8 pt-6 border-t-4 border-black">
                            <Button
                                onClick={prevStep}
                                disabled={currentStep === 1}
                                variant="outline"
                                className="font-bold px-6 py-3 rounded-none border-4 border-black bg-transparent disabled:opacity-50"
                            >
                                Previous
                            </Button>

                            <div className="flex gap-4">
                                {currentStep === 4 ? (
                                    <>
                                        <Button
                                            variant="outline"
                                            className="font-bold px-6 py-3 rounded-none border-4 border-black bg-transparent"
                                        >
                                            <Eye className="w-4 h-4 mr-2" />
                                            Preview
                                        </Button>
                                        <Button className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold px-6 py-3 rounded-none border-4 border-black transition-all duration-200 hover:translate-x-2 hover:translate-y-2 active:translate-x-0 active:translate-y-0">
                                            <Save className="w-4 h-4 mr-2" />
                                            Deploy Strategy
                                        </Button>
                                    </>
                                ) : (
                                    <Button
                                        onClick={nextStep}
                                        className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold px-6 py-3 rounded-none border-4 border-black transition-all duration-200 hover:translate-x-2 hover:translate-y-2 active:translate-x-0 active:translate-y-0"
                                    >
                                        Next Step
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </section>
    )
}
