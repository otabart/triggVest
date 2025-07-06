"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Edit, Twitter, Target, Zap, Crosshair } from "lucide-react"

interface WorkflowStep {
    trigger: {
        type: string
        source: string
        keywords: string[]
        description: string
    }
    conditions: Array<{
        type: string
        value: string
        description: string
    }>
    action: {
        type: string
        amount: string
        description: string
    }
    target: {
        token: string
        blockchain: string
        exchange: string
        description: string
    }
}

interface StrategyWorkflowProps {
    workflow: WorkflowStep
    isEditing: boolean
}

export function StrategyWorkflow({ workflow, isEditing }: StrategyWorkflowProps) {
    const [editingStep, setEditingStep] = useState<string | null>(null)

    const WorkflowBox = ({
        title,
        icon: Icon,
        content,
        stepId,
        color = "bg-card",
    }: {
        title: string
        icon: any
        content: React.ReactNode
        stepId: string
        color?: string
    }) => (
        <div className="relative">
            <Card
                className={`rounded-none border-4 border-black ${color} transition-all duration-300 hover:translate-x-1 hover:translate-y-1`}
            >
                <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="bg-accent/20 p-3 rounded-none border-2 border-black">
                                <Icon className="w-6 h-6 text-accent" />
                            </div>
                            <h3 className="text-xl font-bold font-sans text-foreground">{title}</h3>
                        </div>
                        {isEditing && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingStep(editingStep === stepId ? null : stepId)}
                                className="rounded-none border-2 border-black bg-transparent"
                            >
                                <Edit className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                    {content}
                </CardContent>
            </Card>
        </div>
    )

    const Arrow = () => (
        <div className="flex items-center justify-center py-8">
            <div className="flex flex-col items-center">
                <ArrowRight className="w-8 h-8 text-accent" />
                <div className="w-16 h-1 bg-accent mt-2"></div>
            </div>
        </div>
    )

    return (
        <div className="space-y-0">
            {/* Desktop Layout */}
            <div className="hidden lg:block">
                <div className="flex items-center gap-8">
                    {/* Trigger */}
                    <div className="flex-1">
                        <WorkflowBox
                            title="Trigger"
                            icon={Twitter}
                            stepId="trigger"
                            content={
                                <div className="space-y-3">
                                    <div>
                                        <div className="text-sm font-bold text-accent mb-1">SOURCE</div>
                                        <div className="text-lg font-bold">{workflow.trigger.source}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-accent mb-1">KEYWORDS</div>
                                        <div className="flex flex-wrap gap-2">
                                            {workflow.trigger.keywords.map((keyword, index) => (
                                                <span key={index} className="px-2 py-1 bg-accent/20 border-2 border-black text-sm font-bold">
                                                    {keyword}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="text-sm text-muted-foreground">{workflow.trigger.description}</div>
                                </div>
                            }
                        />
                    </div>

                    <Arrow />

                    {/* Conditions */}
                    <div className="flex-1">
                        <WorkflowBox
                            title="Conditions"
                            icon={Target}
                            stepId="conditions"
                            color="bg-blue-50"
                            content={
                                <div className="space-y-3">
                                    {workflow.conditions.map((condition, index) => (
                                        <div key={index}>
                                            <div className="text-sm font-bold text-accent mb-1">{condition.type.toUpperCase()}</div>
                                            <div className="text-lg font-bold">{condition.value}</div>
                                            <div className="text-sm text-muted-foreground">{condition.description}</div>
                                        </div>
                                    ))}
                                </div>
                            }
                        />
                    </div>

                    <Arrow />

                    {/* Action */}
                    <div className="flex-1">
                        <WorkflowBox
                            title="Action"
                            icon={Zap}
                            stepId="action"
                            color="bg-green-50"
                            content={
                                <div className="space-y-3">
                                    <div>
                                        <div className="text-sm font-bold text-accent mb-1">TYPE</div>
                                        <div className="text-lg font-bold">{workflow.action.type.toUpperCase()}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-accent mb-1">AMOUNT</div>
                                        <div className="text-lg font-bold">{workflow.action.amount}</div>
                                    </div>
                                    <div className="text-sm text-muted-foreground">{workflow.action.description}</div>
                                </div>
                            }
                        />
                    </div>

                    <Arrow />

                    {/* Target */}
                    <div className="flex-1">
                        <WorkflowBox
                            title="Target"
                            icon={Crosshair}
                            stepId="target"
                            color="bg-purple-50"
                            content={
                                <div className="space-y-3">
                                    <div>
                                        <div className="text-sm font-bold text-accent mb-1">TOKEN</div>
                                        <div className="text-lg font-bold">{workflow.target.token}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-accent mb-1">BLOCKCHAIN</div>
                                        <div className="text-lg font-bold">{workflow.target.blockchain}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-accent mb-1">EXCHANGE</div>
                                        <div className="text-lg font-bold">{workflow.target.exchange}</div>
                                    </div>
                                    <div className="text-sm text-muted-foreground">{workflow.target.description}</div>
                                </div>
                            }
                        />
                    </div>
                </div>
            </div>

            {/* Mobile Layout */}
            <div className="lg:hidden space-y-4">
                <WorkflowBox
                    title="Trigger"
                    icon={Twitter}
                    stepId="trigger"
                    content={
                        <div className="space-y-3">
                            <div>
                                <div className="text-sm font-bold text-accent mb-1">SOURCE</div>
                                <div className="text-lg font-bold">{workflow.trigger.source}</div>
                            </div>
                            <div>
                                <div className="text-sm font-bold text-accent mb-1">KEYWORDS</div>
                                <div className="flex flex-wrap gap-2">
                                    {workflow.trigger.keywords.map((keyword, index) => (
                                        <span key={index} className="px-2 py-1 bg-accent/20 border-2 border-black text-sm font-bold">
                                            {keyword}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    }
                />

                <div className="flex justify-center">
                    <ArrowRight className="w-6 h-6 text-accent rotate-90" />
                </div>

                <WorkflowBox
                    title="Conditions"
                    icon={Target}
                    stepId="conditions"
                    color="bg-blue-50"
                    content={
                        <div className="space-y-3">
                            {workflow.conditions.map((condition, index) => (
                                <div key={index}>
                                    <div className="text-sm font-bold text-accent mb-1">{condition.type.toUpperCase()}</div>
                                    <div className="text-lg font-bold">{condition.value}</div>
                                </div>
                            ))}
                        </div>
                    }
                />

                <div className="flex justify-center">
                    <ArrowRight className="w-6 h-6 text-accent rotate-90" />
                </div>

                <WorkflowBox
                    title="Action"
                    icon={Zap}
                    stepId="action"
                    color="bg-green-50"
                    content={
                        <div className="space-y-3">
                            <div>
                                <div className="text-sm font-bold text-accent mb-1">TYPE</div>
                                <div className="text-lg font-bold">{workflow.action.type.toUpperCase()}</div>
                            </div>
                            <div>
                                <div className="text-sm font-bold text-accent mb-1">AMOUNT</div>
                                <div className="text-lg font-bold">{workflow.action.amount}</div>
                            </div>
                        </div>
                    }
                />

                <div className="flex justify-center">
                    <ArrowRight className="w-6 h-6 text-accent rotate-90" />
                </div>

                <WorkflowBox
                    title="Target"
                    icon={Crosshair}
                    stepId="target"
                    color="bg-purple-50"
                    content={
                        <div className="space-y-3">
                            <div>
                                <div className="text-sm font-bold text-accent mb-1">TOKEN</div>
                                <div className="text-lg font-bold">{workflow.target.token}</div>
                            </div>
                            <div>
                                <div className="text-sm font-bold text-accent mb-1">BLOCKCHAIN</div>
                                <div className="text-lg font-bold">{workflow.target.blockchain}</div>
                            </div>
                        </div>
                    }
                />
            </div>
        </div>
    )
}
