// EXEMPLE D'INTÉGRATION - Comment modifier le formulaire create-strategy-form.tsx
// Ce fichier montre comment ajouter la fonctionnalité de soumission à l'API existante

import { useState } from 'react';
import { createStrategy, transformFormDataToAPIRequest } from '@/lib/api';

// Exemple de fonction à ajouter dans CreateStrategyForm
export function useStrategySubmission() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<any>(null);

  const handleSubmitStrategy = async (formData: any, userWalletAddress: string) => {
    setIsSubmitting(true);
    setSubmissionResult(null);

    try {
      // Transformer les données du formulaire vers le format API
      const apiRequest = transformFormDataToAPIRequest(formData, userWalletAddress);
      
      console.log('📋 Données transformées pour l\'API:', apiRequest);

      // Appeler l'API existante
      const result = await createStrategy(apiRequest);

      if (result.success) {
        console.log('🎉 Stratégie créée avec succès!');
        console.log('📄 Détails:', result.strategy);
        
        // Afficher les informations importantes
        alert(`✅ Stratégie créée avec succès!
        
📋 Nom: ${result.strategy?.strategyName}
📍 Wallet généré: ${result.strategy?.generatedAddress}
🔐 Smart Account: ${result.strategy?.smartAccount?.address || 'Non créé'}
🌐 Chaîne: ${result.strategy?.smartAccount?.chain || 'N/A'}
        
Les clés privées sont stockées de manière sécurisée et chiffrées.`);
        
      } else {
        console.error('❌ Erreur:', result.message);
        alert(`❌ Erreur lors de la création: ${result.message}`);
      }

      setSubmissionResult(result);
      
    } catch (error) {
      console.error('❌ Erreur lors de la soumission:', error);
      alert(`❌ Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      setSubmissionResult({
        success: false,
        message: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    submissionResult,
    handleSubmitStrategy
  };
}

// EXEMPLE D'UTILISATION dans CreateStrategyForm
/*
export function CreateStrategyForm() {
  const [formData, setFormData] = useState({...});
  const { isSubmitting, submissionResult, handleSubmitStrategy } = useStrategySubmission();
  
  // Supposons que vous avez l'adresse wallet de l'utilisateur
  const userWalletAddress = "0x1234567890123456789012345678901234567890"; // À récupérer depuis votre contexte wallet
  
  const handleDeployStrategy = async () => {
    if (!userWalletAddress) {
      alert('Veuillez connecter votre wallet d\'abord');
      return;
    }
    
    // Validation des données
    if (!formData.name || !formData.triggerType || !formData.actionType) {
      alert('Veuillez remplir tous les champs requis');
      return;
    }
    
    // Appeler la fonction de soumission
    await handleSubmitStrategy(formData, userWalletAddress);
  };

  return (
    <div>
      // ... reste du formulaire
      
      <Button
        onClick={handleDeployStrategy}
        disabled={isSubmitting}
        className="bg-accent text-accent-foreground hover:bg-accent/90 font-bold px-6 py-3 rounded-none border-4 border-black"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Création en cours...
          </>
        ) : (
          <>
            <Save className="w-4 h-4 mr-2" />
            Deploy Strategy
          </>
        )}
      </Button>
    </div>
  );
}
*/ 