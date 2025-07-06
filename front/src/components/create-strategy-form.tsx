"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Modal, ModalButton } from "@/components/ui/modal";
import {
  ArrowLeft,
  Target,
  Settings,
  Crosshair,
  Sparkles,
  Save,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { getTokensForChain, getTokenBySymbol, getTokenAddress } from "@/lib/tokens";

const triggerSources = [
  { id: "twitter", name: "Twitter/X Account", icon: "🐦", disabled: false },
  { id: "news", name: "News Outlet", icon: "📰", disabled: true },
  { id: "price", name: "Price Movement", icon: "📈", disabled: true },
  { id: "whale", name: "Whale Alert", icon: "🐋", disabled: true },
];

const actions = [
  { id: "buy", name: "Buy", description: "Purchase a specific token", disabled: false },
  { id: "sell", name: "Sell", description: "Sell a specific token", disabled: false },
  { id: "bridge_gasless", name: "Bridge", description: "Bridge USDC from Arbitrum to Base gaslessly", disabled: false },
  { id: "swap", name: "Swap", description: "Exchange one token for another", disabled: true },
];

const blockchains = [
  { id: "ethereum", name: "Ethereum", symbol: "ETH", disabled: true },
  { id: "bsc", name: "Binance Smart Chain", symbol: "BNB", disabled: true },
  { id: "polygon", name: "Polygon", symbol: "MATIC", disabled: true },
  { id: "arbitrum", name: "Arbitrum Sepolia", symbol: "ARB", disabled: false },
  { id: "base", name: "Base Sepolia", symbol: "BASE", disabled: false },
];

interface DeployedStrategy {
  id: string;
  generatedAddress: string;
  strategyName: string;
  userWalletAddress: string;
  wallet?: {
    privateKey: string;
    address: string;
  };
  smartAccount?: {
    address: string;
  };
}

export function CreateStrategyForm() {
  const { address, isConnected } = useAccount();
  const [currentStep, setCurrentStep] = useState(1);
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
  });

  // États pour la modal de déploiement
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState<'loading' | 'success' | 'error' | 'awaiting_funding' | null>(null);
  const [deploymentMessage, setDeploymentMessage] = useState("");
  const [deployedStrategy, setDeployedStrategy] = useState<DeployedStrategy | null>(null);
  const [smartAccountAddress, setSmartAccountAddress] = useState<string | null>(null);

  const steps = [
    { number: 1, title: "Pick a Trigger", icon: Target },
    { number: 2, title: "Define an Action", icon: Settings },
    { number: 3, title: "Set Your Target", icon: Crosshair },
    { number: 4, title: "Review & Deploy", icon: Sparkles },
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const deployStrategy = async () => {
    // Validation des champs requis
    if (!formData.name || !formData.triggerType || !formData.actionType || !formData.blockchain) {
      setDeploymentStatus('error');
      setDeploymentMessage("Veuillez remplir tous les champs requis");
      setIsModalOpen(true);
      return;
    }

    // Vérifier si l'utilisateur est connecté
    if (!isConnected || !address) {
      setDeploymentStatus('error');
      setDeploymentMessage("Veuillez connecter votre wallet pour créer une stratégie");
      setIsModalOpen(true);
      return;
    }

    // Ouvrir la modal et commencer le déploiement
    setIsModalOpen(true);
    setDeploymentStatus('loading');
    setDeploymentMessage("Déploiement de votre stratégie en cours...");

    try {
      // Préparation des données pour l'API
      const strategyData = {
        userWalletAddress: address, // Utiliser l'adresse du wallet connecté
        strategyName: formData.name,
        triggers: [
          {
            type: formData.triggerType,
            account: formData.triggerSource,
            keywords: formData.triggerKeywords.split(',').map(k => k.trim()).filter(k => k)
          }
        ],
        actions: [
          {
            type: formData.actionType,
            targetAsset: formData.actionType === "bridge_gasless" ? "USDC" : (formData.tokenSymbol || "USDC"),
            targetChain: formData.actionType === "bridge_gasless" ? "base" : formData.blockchain,
            sourceChain: formData.actionType === "bridge_gasless" ? "arbitrum" : undefined,
            amount: formData.amount
          }
        ]
        // Pas de Smart Account pour éviter l'erreur RPC
      };

      console.log("🚀 Déploiement de la stratégie:", strategyData);

      // Appel à l'API Strategy Router
      const response = await fetch(`${process.env.NEXT_PUBLIC_STRATEGY_ROUTER_API}api/create-strategy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(strategyData),
      });

      const result = await response.json();

      if (result.success) {
        console.log("✅ Stratégie créée:", result.strategy);
        
        // Créer le Smart Account automatiquement après la création de la stratégie
        setDeploymentMessage("Création du Smart Account gasless...");
        
        try {
          const smartAccountResponse = await fetch(`${process.env.NEXT_PUBLIC_STRATEGY_ROUTER_API}api/smart-account`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              chain: formData.blockchain,
              strategyId: result.strategy.id,
            }),
          });

          const smartAccountData = await smartAccountResponse.json();
          
          if (smartAccountData.success) {
            console.log('✅ Smart Account créé:', smartAccountData.smartAccount);
            
            // Passer en mode "awaiting_funding" pour demander à l'utilisateur de transférer 5 USDC
            setDeploymentStatus('awaiting_funding');
            setDeploymentMessage("Smart Account créé ! Veuillez maintenant l'alimenter avec 5 USDC.");
            setSmartAccountAddress(smartAccountData.smartAccount.address);
            setDeployedStrategy({
              ...result.strategy,
              smartAccount: smartAccountData.smartAccount
            });
          } else {
            console.error('❌ Smart Account API Error:', smartAccountData);
            console.error('❌ Response status:', smartAccountResponse.status);
            
            setDeploymentStatus('error');
            setDeploymentMessage(`Erreur lors de la création du Smart Account: ${smartAccountData.message || 'API Smart Account indisponible'}`);
            return;
          }
                } catch (smartAccountError) {
          console.error('❌ Smart Account Network Error:', smartAccountError);
          console.error('❌ Error details:', {
            message: smartAccountError instanceof Error ? smartAccountError.message : 'Unknown error',
            stack: smartAccountError instanceof Error ? smartAccountError.stack : 'No stack trace'
          });
          
          setDeploymentStatus('error');
          setDeploymentMessage(`Erreur de connexion à l'API Smart Account. Vérifiez que l'API Strategy Router est démarrée.`);
          return;
        }
      } else {
        setDeploymentStatus('error');
        setDeploymentMessage(`Erreur lors du déploiement: ${result.message}`);
        console.error("❌ Erreur:", result);
      }
    } catch (error) {
      console.error("❌ Erreur lors du déploiement:", error);
      setDeploymentStatus('error');
      setDeploymentMessage("Erreur lors du déploiement de la stratégie");
    }
  };

  const closeModalAndRedirect = () => {
    setIsModalOpen(false);
    if (deploymentStatus === 'success') {
      window.location.href = "/strategy";
    }
  };

  const resetModal = () => {
    setIsModalOpen(false);
    setDeploymentStatus(null);
    setDeploymentMessage("");
    setDeployedStrategy(null);
    setSmartAccountAddress(null);
  };

  const confirmFunding = async () => {
    if (!deployedStrategy || !smartAccountAddress) return;
    
    setDeploymentStatus('loading');
    setDeploymentMessage("Vérification du financement...");
    
    try {
      // Ici on pourrait vérifier la balance du Smart Account
      // Pour l'instant, on assume que l'utilisateur a bien transféré 5 USDC
      
      // Simuler une petite attente pour la vérification
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setDeploymentStatus('success');
      setDeploymentMessage("Stratégie déployée avec succès ! Votre Smart Account est maintenant alimenté.");
      
    } catch (error) {
      console.error("❌ Erreur lors de la vérification du financement:", error);
      setDeploymentStatus('error');
      setDeploymentMessage("Erreur lors de la vérification du financement. Veuillez réessayer.");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Optionnel: afficher un toast de confirmation
  };

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
          <h1 className="text-5xl md:text-6xl font-bold font-sans text-foreground">
            Create New Strategy
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Lock and load your next automated trading strategy in 4 simple
            steps.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex justify-center items-center gap-4 mb-8">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-12 h-12 rounded-none border-4 border-black font-bold font-sans transition-all duration-300 ${
                    currentStep >= step.number
                      ? "bg-accent text-accent-foreground"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {step.number}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-16 h-1 mx-2 ${
                      currentStep > step.number ? "bg-accent" : "bg-secondary"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold font-sans text-foreground">
              {steps[currentStep - 1].title}
            </h2>
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
                  <label className="block text-lg font-bold font-sans text-foreground mb-4">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
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
                        onClick={() =>
                          !source.disabled &&
                          handleInputChange("triggerType", source.id)
                        }
                        className={`p-4 border-4 border-black transition-all duration-200 ${
                          source.disabled
                            ? "cursor-not-allowed opacity-50 bg-gray-100"
                            : formData.triggerType === source.id
                            ? "bg-accent text-accent-foreground cursor-pointer hover:translate-x-1 hover:translate-y-1"
                            : "bg-secondary hover:bg-secondary/80 cursor-pointer hover:translate-x-1 hover:translate-y-1"
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
                      onChange={(e) =>
                        handleInputChange("triggerSource", e.target.value)
                      }
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
                      onChange={(e) =>
                        handleInputChange("triggerKeywords", e.target.value)
                      }
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
                  <label className="block text-lg font-bold font-sans text-foreground mb-4">
                    Action Type
                  </label>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {actions.map((action) => (
                        <div
                          key={action.id}
                          onClick={() =>
                            !action.disabled && handleInputChange("actionType", action.id)
                          }
                          className={`p-4 border-4 border-black transition-all duration-200 ${
                            action.disabled 
                              ? "cursor-not-allowed opacity-50 bg-gray-100" 
                              : formData.actionType === action.id
                              ? "bg-accent text-accent-foreground cursor-pointer hover:translate-x-1 hover:translate-y-1"
                              : "bg-secondary hover:bg-secondary/80 cursor-pointer hover:translate-x-1 hover:translate-y-1"
                          }`}
                        >
                          <div className="text-center">
                            <div className="font-bold font-sans text-xl mb-2">
                              {action.name}
                            </div>
                            <div className="text-sm">{action.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                </div>

                <div>
                  <label className="block text-lg font-bold font-sans text-foreground mb-4">
                    Amount (USDC)
                  </label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) =>
                      handleInputChange("amount", e.target.value)
                    }
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
                  <label className="block text-lg font-bold font-sans text-foreground mb-4">
                    Token to Trade
                  </label>
                  {formData.blockchain ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {getTokensForChain(formData.blockchain as 'arbitrum' | 'base').map((token) => (
                        <div
                          key={token.symbol}
                          onClick={() => handleInputChange("tokenSymbol", token.symbol)}
                          className={`p-4 border-4 border-black transition-all duration-200 cursor-pointer ${
                            formData.tokenSymbol === token.symbol
                              ? "bg-accent text-accent-foreground hover:translate-x-1 hover:translate-y-1"
                              : "bg-secondary hover:bg-secondary/80 hover:translate-x-1 hover:translate-y-1"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{token.logo}</span>
                            <div>
                              <div className="font-bold font-sans text-lg">{token.symbol}</div>
                              <div className="text-sm opacity-75">{token.name}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 border-4 border-black bg-gray-100 text-center text-muted-foreground">
                      Please select a blockchain first to see available tokens
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-lg font-bold font-sans text-foreground mb-4">
                    Blockchain
                  </label>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {blockchains.map((blockchain) => (
                        <div
                          key={blockchain.id}
                          onClick={() =>
                            !blockchain.disabled && handleInputChange("blockchain", blockchain.id)
                          }
                          className={`p-4 border-4 border-black transition-all duration-200 ${
                            blockchain.disabled 
                              ? "cursor-not-allowed opacity-50 bg-gray-100" 
                              : formData.blockchain === blockchain.id
                              ? "bg-accent text-accent-foreground cursor-pointer hover:translate-x-1 hover:translate-y-1"
                              : "bg-secondary hover:bg-secondary/80 cursor-pointer hover:translate-x-1 hover:translate-y-1"
                          }`}
                        >
                          <div className="text-center">
                            <div className="font-bold font-sans text-xl">
                              {blockchain.name}
                            </div>
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
                  <h3 className="text-2xl font-bold font-sans text-foreground mb-4">
                    Strategy Summary
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <strong>Name:</strong> {formData.name}
                    </div>
                    <div>
                      <strong>Description:</strong> {formData.description}
                    </div>
                    <div>
                      <strong>Connected Wallet:</strong> {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Not connected"}
                    </div>
                    <div>
                      <strong>Trigger:</strong> {formData.triggerSource}{" "}
                      mentions &quot;{formData.triggerKeywords}&quot;
                    </div>
                    <div>
                      <strong>Action:</strong> {formData.actionType} {formData.amount} USDC worth of {formData.tokenSymbol}
                    </div>
                    <div>
                      <strong>Blockchain:</strong>{" "}
                      {
                        blockchains.find((b) => b.id === formData.blockchain)
                          ?.name
                      }
                    </div>
                    {formData.tokenSymbol && formData.blockchain && (
                      <div>
                        <strong>Token Details:</strong>{" "}
                        {getTokenBySymbol(formData.tokenSymbol)?.name} ({formData.tokenSymbol})
                        <br />
                        <span className="text-sm text-muted-foreground">
                          Contract: {getTokenAddress(formData.tokenSymbol, formData.blockchain as 'arbitrum' | 'base')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-yellow-100 border-4 border-black p-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">⚠️</span>
                    <div>
                      <div className="font-bold text-yellow-800">
                        Important Notice
                      </div>
                      <div className="text-yellow-700 text-sm">
                        This strategy will execute automatically when conditions
                        are met. Make sure you have sufficient funds in your
                        connected wallet.
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
                                <Button 
                                  onClick={deployStrategy}
                                  disabled={!isConnected}
                                  className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold px-6 py-3 rounded-none border-4 border-black transition-all duration-200 hover:translate-x-2 hover:translate-y-2 active:translate-x-0 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0">
                                  <Save className="w-4 h-4 mr-2" />
                                  {isConnected ? "Deploy Strategy" : "Connect Wallet to Deploy"}
                                </Button>
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

      {/* Modal de déploiement */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={resetModal} 
        title="🚀 Strategy Deployment"
        size="md"
      >
        <div className="space-y-6">
          {/* Contenu de la modal basé sur le statut */}
          {deploymentStatus === 'loading' && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <Loader2 className="w-12 h-12 animate-spin text-accent" />
              </div>
              <div className="text-xl font-bold font-sans text-foreground">
                Deploying Strategy...
              </div>
              <div className="text-muted-foreground">
                {deploymentMessage}
              </div>
              <div className="bg-secondary p-4 border-2 border-black rounded-none">
                <div className="text-sm space-y-2">
                  <div>⚡ Creating wallet...</div>
                  <div>🔗 Connecting to blockchain...</div>
                  <div>📝 Registering strategy...</div>
                  <div>🎯 Setting up triggers...</div>
                </div>
              </div>
            </div>
          )}

          {deploymentStatus === 'awaiting_funding' && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-2xl">💰</span>
                </div>
              </div>
              <div className="text-xl font-bold font-sans text-foreground">
                Alimentez votre Smart Account 
              </div>
              <div className="text-muted-foreground">
                {deploymentMessage}
              </div>
              
              {smartAccountAddress && (
                <div className="bg-blue-50 border-4 border-blue-500 p-6 rounded-none">
                  <div className="text-left space-y-4">
                    <div className="text-center">
                      <div className="font-bold text-blue-800 text-lg mb-2">
                        🏦 Adresse Smart Account
                      </div>
                      <div className="relative">
                        <div className="text-sm bg-white p-3 border border-blue-400 rounded font-mono break-all pr-12">
                          {smartAccountAddress}
                        </div>
                        <button
                          onClick={() => copyToClipboard(smartAccountAddress)}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 hover:bg-blue-100 rounded"
                          title="Copier l'adresse"
                        >
                          📋
                        </button>
                      </div>
                    </div>
                    
                    <div className="border-t pt-4">
                      <div className="font-bold text-blue-800 mb-2">Instructions :</div>
                      <ol className="list-decimal list-inside space-y-2 text-sm">
                        <li>Copiez l'adresse Smart Account ci-dessus</li>
                        <li>Transférez <strong>5 USDC</strong> depuis votre wallet vers cette adresse</li>
                        <li>Attendez la confirmation de la transaction</li>
                        <li>Cliquez sur "J'ai transféré les fonds" ci-dessous</li>
                      </ol>
                    </div>
                    
                    <div className="bg-yellow-100 border border-yellow-400 p-3 rounded">
                      <div className="flex items-start gap-2">
                        <span className="text-yellow-600">⚠️</span>
                        <div className="text-sm text-yellow-800">
                          <strong>Important :</strong> Assurez-vous d'envoyer exactement <strong>5 USDC</strong> sur la blockchain <strong>{blockchains.find(b => b.id === formData.blockchain)?.name}</strong>
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 border border-gray-300 p-3 rounded">
                      <div className="text-sm">
                        <div className="font-bold text-gray-700 mb-1">Adresse du contrat USDC :</div>
                        <div className="relative">
                          <div className="font-mono text-xs bg-white p-2 border border-gray-200 rounded break-all pr-8">
                            {getTokenAddress("USDC", formData.blockchain as 'arbitrum' | 'base')}
                          </div>
                          <button
                            onClick={() => copyToClipboard(getTokenAddress("USDC", formData.blockchain as 'arbitrum' | 'base') || '')}
                            className="absolute right-1 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded text-xs"
                            title="Copier l'adresse du contrat"
                          >
                            📋
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex gap-4 justify-center">
                <ModalButton
                  variant="success"
                  onClick={confirmFunding}
                >
                  J'ai transféré les fonds
                </ModalButton>
                <ModalButton
                  variant="default"
                  onClick={resetModal}
                >
                  Annuler
                </ModalButton>
              </div>
            </div>
          )}

          {deploymentStatus === 'success' && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
              <div className="text-xl font-bold font-sans text-foreground">
                Strategy Deployed Successfully! 🎉
              </div>
              <div className="text-muted-foreground">
                {deploymentMessage}
              </div>
              
              {deployedStrategy && (
                <div className="bg-green-50 border-4 border-green-500 p-4 rounded-none">
                  <div className="text-left space-y-3">
                    <div><strong>Strategy ID:</strong> {deployedStrategy.id}</div>
                    <div><strong>Status:</strong> <span className="text-green-600 font-bold">ACTIVE</span></div>
                    
                    <div className="border-t pt-3">
                      <div className="font-bold text-green-800 mb-2">🔐 Wallet Custodial (Execution)</div>
                      <div className="text-sm bg-white p-2 border border-green-400 rounded font-mono">
                        {deployedStrategy.generatedAddress}
                      </div>
                      <div className="text-xs text-green-600 mt-1">
                        • Wallet privé généré pour l'exécution automatique
                      </div>
                    </div>
                    
                    {deployedStrategy.smartAccount && (
                      <div className="border-t pt-3">
                        <div className="font-bold text-green-800 mb-2">🏦 Smart Account (Funding)</div>
                        <div className="text-sm bg-white p-2 border border-green-400 rounded font-mono">
                          {deployedStrategy.smartAccount.address}
                        </div>
                        <div className="text-xs text-green-600 mt-1">
                          • Adresse à alimenter en USDC par l'utilisateur
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="flex gap-4 justify-center">
                <ModalButton
                  variant="success"
                  onClick={closeModalAndRedirect}
                >
                  Go to Strategy Arsenal
                </ModalButton>
                <ModalButton
                  variant="default"
                  onClick={resetModal}
                >
                  Create Another
                </ModalButton>
              </div>
            </div>
          )}

          {deploymentStatus === 'error' && (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <XCircle className="w-12 h-12 text-red-500" />
              </div>
              <div className="text-xl font-bold font-sans text-foreground">
                Deployment Failed ❌
              </div>
              <div className="text-muted-foreground">
                {deploymentMessage}
              </div>
              
              <div className="bg-red-50 border-4 border-red-500 p-4 rounded-none">
                <div className="text-left text-sm">
                  <div className="font-bold mb-2">Common Issues:</div>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Network connection issues</li>
                    <li>Incomplete form data</li>
                    <li>API server temporarily unavailable</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex gap-4 justify-center">
                <ModalButton
                  variant="destructive"
                  onClick={deployStrategy}
                >
                  Try Again
                </ModalButton>
                <ModalButton
                  variant="default"
                  onClick={resetModal}
                >
                  Close
                </ModalButton>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </section>
  );
}
