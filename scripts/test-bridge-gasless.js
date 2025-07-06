console.log('🚀 Test du bridge gasless avec la clé privée de démonstration configurée');

const jobData = {
  type: 'bridge_gasless',
  smartAccount: '0x30FaA798B5d332A733150bCA1556D7BeDA2CeB87',
  fromChain: 'base',
  toChain: 'arbitrum',
  amount: '5.0',
  token: 'USDC'
};

console.log('📋 Données du job:', JSON.stringify(jobData, null, 2));

// Tester l'envoi du job au Circle Executor
fetch('http://localhost:3003/process-job', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(jobData)
})
.then(response => response.json())
.then(data => {
  console.log('✅ Réponse du Circle Executor:', JSON.stringify(data, null, 2));
})
.catch(error => {
  console.error('❌ Erreur:', error);
}); 