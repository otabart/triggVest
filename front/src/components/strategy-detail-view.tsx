"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Modal } from "@/components/ui/modal"
import { StrategyWorkflow } from "@/components/strategy-workflow"
import { StrategyStats } from "@/components/strategy-stats"
import { StrategyLogs } from "@/components/strategy-logs"
import { ArrowLeft, Play, Pause, Trash2, Edit3, Loader2 } from "lucide-react"
import Link from "next/link"

interface Strategy {
    id: string;
    name: string;
    description: string;
    status: "active" | "paused" | "inactive";
    userWalletAddress: string;
    generatedAddress?: string;
    triggers: Array<{
        type: string;
        account: string;
        keywords: string[];
    }>;
    actions: Array<{
        type: string;
        targetAsset: string;
        targetChain: string;
        amount: string;
    }>;
    createdAt: string;
    updatedAt: string;
    // Données calculées pour l'affichage
    performance?: string;
    totalVolume?: string;
    successRate?: string;
    lastTriggered?: string;
    totalTriggers?: number;
    workflow?: {
        trigger: {
            type: string;
            source: string;
            keywords: string[];
            description: string;
        };
        conditions: Array<{
            type: string;
            value: string;
            description: string;
        }>;
        action: {
            type: string;
            amount: string;
            description: string;
        };
        target: {
            token: string;
            blockchain: string;
            exchange: string;
            description: string;
        };
    };
}

interface StrategyDetailViewProps {
    strategyId: string
}

export function StrategyDetailView({ strategyId }: StrategyDetailViewProps) {
    const router = useRouter()
    const [strategy, setStrategy] = useState<Strategy | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isError, setIsError] = useState(false)
    const [errorMessage, setErrorMessage] = useState("")
    const [isEditing, setIsEditing] = useState(false)
    const [isUpdating, setIsUpdating] = useState(false)
    const [activeTab, setActiveTab] = useState("workflow")
    const [editForm, setEditForm] = useState({
        name: "",
        description: ""
    })
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

    // Récupérer les données de la stratégie
    useEffect(() => {
        fetchStrategy()
    }, [strategyId])

    const fetchStrategy = async () => {
        try {
            setIsLoading(true)
            setIsError(false)
            
            console.log('🔍 Recherche de la stratégie ID:', strategyId)
            
            // Utiliser la nouvelle route API spécifique
            const response = await fetch(`${process.env.NEXT_PUBLIC_STRATEGY_ROUTER_API}api/strategy/${strategyId}`)
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Stratégie non trouvée')
                }
                throw new Error('Erreur lors de la récupération de la stratégie')
            }
            
            const data = await response.json()
            console.log('📊 Données reçues de l\'API:', data)
            
            if (!data.success || !data.strategy) {
                throw new Error(data.message || 'Stratégie non trouvée')
            }
            
            const foundStrategy = data.strategy
            console.log('🎯 Stratégie trouvée:', foundStrategy)
            
            // Transformation des données API vers le format d'affichage
            const formattedStrategy: Strategy = {
                ...foundStrategy,
                status: foundStrategy.status || "active",
                performance: "+12.5%", // Placeholder - à calculer plus tard
                totalVolume: "$2,350", // Placeholder - à calculer plus tard
                successRate: "85%", // Placeholder - à calculer plus tard
                lastTriggered: "1 hour ago", // Placeholder - à calculer plus tard
                totalTriggers: 8, // Placeholder - à calculer plus tard
                workflow: {
                    trigger: {
                        type: foundStrategy.triggers?.[0]?.type || "twitter",
                        source: foundStrategy.triggers?.[0]?.account || "",
                        keywords: foundStrategy.triggers?.[0]?.keywords || [],
                        description: `Monitor ${foundStrategy.triggers?.[0]?.account || "account"} for mentions of ${foundStrategy.triggers?.[0]?.keywords?.join(", ") || "keywords"}`
                    },
                    conditions: [
                        {
                            type: "sentiment",
                            value: "positive",
                            description: "Only trigger on positive sentiment tweets"
                        }
                    ],
                    action: {
                        type: foundStrategy.actions?.[0]?.type || "buy",
                        amount: `$${foundStrategy.actions?.[0]?.amount ?? "0"}`,
                        description: `${foundStrategy.actions?.[0]?.type === "buy" ? "Purchase" : "Sell"} $${foundStrategy.actions?.[0]?.amount ?? "0"} worth of ${foundStrategy.actions?.[0]?.targetAsset || "USDC"}`
                    },
                    target: {
                        token: foundStrategy.actions?.[0]?.targetAsset || "USDC",
                        blockchain: foundStrategy.actions?.[0]?.targetChain || "arbitrum",
                        exchange: "Uniswap",
                        description: `Execute on ${foundStrategy.actions?.[0]?.targetChain || "Arbitrum"} via Uniswap`
                    }
                }
            }
            
            setStrategy(formattedStrategy)
            setEditForm({
                name: formattedStrategy.name,
                description: formattedStrategy.description
            })
            
        } catch (error) {
            console.error('Erreur lors de la récupération de la stratégie:', error)
            setIsError(true)
            setErrorMessage(error instanceof Error ? error.message : 'Erreur inconnue')
        } finally {
            setIsLoading(false)
        }
    }

    // Fonctions des CTAs
    const toggleStrategyStatus = async () => {
        if (!strategy) return
        
        try {
            setIsUpdating(true)
            const newStatus = strategy.status === "active" ? "paused" : "active"
            
            // TODO: Implémenter l'appel API pour changer le statut
            // const response = await fetch(`${process.env.NEXT_PUBLIC_STRATEGY_ROUTER_API}api/strategy/${strategy.id}/status`, {
            //     method: 'PATCH',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({ status: newStatus })
            // })
            
            // Pour l'instant, simulation
            setStrategy(prev => prev ? { ...prev, status: newStatus as "active" | "paused" | "inactive" } : null)
            console.log(`✅ Stratégie ${newStatus === "active" ? "activée" : "mise en pause"}`)
            
        } catch (error) {
            console.error('Erreur lors du changement de statut:', error)
        } finally {
            setIsUpdating(false)
        }
    }

    const deleteStrategy = async () => {
        if (!strategy) return
        
        try {
            setIsUpdating(true)
            setIsDeleteModalOpen(false)
            
            const response = await fetch(`${process.env.NEXT_PUBLIC_STRATEGY_ROUTER_API}api/strategy/${strategy.id}`, {
                method: 'DELETE'
            })
            
            if (!response.ok) {
                throw new Error('Erreur lors de la suppression')
            }
            
            const result = await response.json()
            console.log('✅ Stratégie supprimée:', result)
            router.push('/strategy')
            
        } catch (error) {
            console.error('Erreur lors de la suppression:', error)
            // Optionnel: afficher un message d'erreur à l'utilisateur
        } finally {
            setIsUpdating(false)
        }
    }

    const saveChanges = async () => {
        if (!strategy) return
        
        try {
            setIsUpdating(true)
            
            const response = await fetch(`${process.env.NEXT_PUBLIC_STRATEGY_ROUTER_API}api/strategy/${strategy.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: editForm.name,
                    description: editForm.description
                })
            })
            
            if (!response.ok) {
                throw new Error('Erreur lors de la sauvegarde')
            }
            
            const result = await response.json()
            
            // Mettre à jour la stratégie avec les données du serveur
            setStrategy(prev => prev ? {
                ...prev,
                name: result.strategy.name,
                description: result.strategy.description
            } : null)
            
            setIsEditing(false)
            console.log('✅ Modifications sauvegardées:', result)
            
        } catch (error) {
            console.error('Erreur lors de la sauvegarde:', error)
            // Optionnel: afficher un message d'erreur à l'utilisateur
        } finally {
            setIsUpdating(false)
        }
    }

    // États de chargement et d'erreur
    if (isLoading) {
        return (
            <section className="py-20 md:py-28 bg-background min-h-screen">
                <div className="container mx-auto px-4 md:px-6 max-w-6xl">
                    <div className="flex items-center justify-center">
                        <div className="flex items-center gap-3 text-xl">
                            <Loader2 className="w-8 h-8 animate-spin" />
                            Chargement de la stratégie...
                        </div>
                    </div>
                </div>
            </section>
        )
    }

    if (isError || !strategy) {
        return (
            <section className="py-20 md:py-28 bg-background min-h-screen">
                <div className="container mx-auto px-4 md:px-6 max-w-6xl">
                    <Link
                        href="/strategy"
                        className="inline-flex items-center gap-2 text-accent hover:text-accent/80 font-bold mb-6 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back to Arsenal
                    </Link>
                    <div className="text-center">
                        <div className="bg-red-50 border-4 border-red-500 p-8 rounded-none">
                            <h2 className="text-2xl font-bold text-red-800 mb-2">Stratégie non trouvée</h2>
                            <p className="text-red-600 mb-4">{errorMessage}</p>
                            <Button 
                                onClick={() => router.push('/strategy')}
                                className="bg-accent text-accent-foreground hover:bg-accent/90"
                            >
                                Retour aux stratégies
                            </Button>
                        </div>
                    </div>
                </div>
            </section>
        )
    }

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
                                onClick={() => {
                                    if (isEditing) {
                                        setIsEditing(false)
                                        if (strategy) {
                                            setEditForm({
                                                name: strategy.name,
                                                description: strategy.description
                                            })
                                        }
                                    } else {
                                        setIsEditing(true)
                                    }
                                }}
                                variant="outline"
                                disabled={isUpdating}
                                className="font-bold px-4 py-2 rounded-none border-4 border-black bg-transparent"
                            >
                                <Edit3 className="w-4 h-4 mr-2" />
                                {isEditing ? "Cancel" : "Edit"}
                            </Button>
                            <Button
                                onClick={toggleStrategyStatus}
                                variant={isActive ? "outline" : "default"}
                                disabled={isUpdating}
                                className={`font-bold px-4 py-2 rounded-none border-4 border-black ${isActive ? "bg-transparent" : "bg-accent text-accent-foreground hover:bg-accent/90"
                                    }`}
                            >
                                {isUpdating ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    isActive ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />
                                )}
                                {isActive ? "Pause" : "Activate"}
                            </Button>
                            <Button
                                onClick={() => setIsDeleteModalOpen(true)}
                                variant="outline"
                                disabled={isUpdating}
                                className="font-bold px-4 py-2 rounded-none border-4 border-black bg-transparent text-red-600 hover:bg-red-50"
                            >
                                {isUpdating ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Trash2 className="w-4 h-4" />
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Stats Overview */}
                <StrategyStats strategy={{
                    performance: strategy.performance || "+0.0%",
                    totalVolume: strategy.totalVolume || "$0",
                    successRate: strategy.successRate || "0%",
                    lastTriggered: strategy.lastTriggered || "Never",
                    totalTriggers: strategy.totalTriggers || 0
                }} />

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
                {activeTab === "workflow" && strategy.workflow && (
                    <StrategyWorkflow workflow={strategy.workflow} isEditing={isEditing} />
                )}

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
                                        value={editForm.name}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full p-3 border-4 border-black rounded-none bg-background text-foreground font-bold"
                                        placeholder="Enter strategy name"
                                    />
                                </div>
                                <div>
                                    <label className="block text-lg font-bold text-foreground mb-2">Description</label>
                                    <textarea
                                        value={editForm.description}
                                        onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                                        rows={3}
                                        className="w-full p-3 border-4 border-black rounded-none bg-background text-foreground resize-none"
                                        placeholder="Enter strategy description"
                                    />
                                </div>
                                <div className="flex gap-3">
                                    <Button 
                                        onClick={saveChanges}
                                        disabled={isUpdating || !editForm.name || !editForm.description}
                                        className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold px-6 py-3 rounded-none border-4 border-black"
                                    >
                                        {isUpdating ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            "Save Changes"
                                        )}
                                    </Button>
                                    <Button 
                                        onClick={() => {
                                            if (strategy) {
                                                setEditForm({
                                                    name: strategy.name,
                                                    description: strategy.description
                                                })
                                            }
                                        }}
                                        variant="outline"
                                        className="font-bold px-6 py-3 rounded-none border-4 border-black bg-transparent"
                                    >
                                        Reset
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Modal de suppression */}
            <Modal 
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                title="Delete Strategy"
                size="md"
            >
                <div className="space-y-6">
                    <div className="text-center">
                        <div className="bg-red-100 border-4 border-red-500 p-6 rounded-none mb-6">
                            <div className="text-red-500 text-6xl mb-4">⚠️</div>
                            <h3 className="text-2xl font-bold text-red-800 mb-2">
                                Danger Zone
                            </h3>
                            <p className="text-red-700 font-medium">
                                This action cannot be undone!
                            </p>
                        </div>
                        
                        <div className="mb-6">
                            <p className="text-lg text-foreground mb-2">
                                You are about to permanently delete:
                            </p>
                            <div className="bg-secondary border-4 border-black p-4 rounded-none">
                                <div className="text-xl font-bold text-foreground">
                                    "{strategy?.name}"
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">
                                    Strategy ID: {strategy?.id}
                                </div>
                            </div>
                        </div>

                        <div className="bg-yellow-100 border-4 border-yellow-500 p-4 rounded-none">
                            <p className="text-yellow-800 font-medium">
                                ⚡ All triggers, actions, and execution history will be lost forever
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3 justify-center">
                        <Button
                            onClick={() => setIsDeleteModalOpen(false)}
                            variant="outline"
                            className="font-bold px-6 py-3 rounded-none border-4 border-black bg-transparent"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={deleteStrategy}
                            disabled={isUpdating}
                            className="font-bold px-6 py-3 rounded-none border-4 border-black bg-red-600 text-white hover:bg-red-700"
                        >
                            {isUpdating ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete Forever
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </Modal>
        </section>
    )
}
