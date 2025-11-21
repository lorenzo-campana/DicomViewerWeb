#!/bin/bash

# Script per inizializzare e fare il push su GitHub
# Esegui questo script per preparare il deployment

echo "🚀 Preparazione deployment DicomViewer Web App"
echo ""

# Controlla se Git è installato
if ! command -v git &> /dev/null; then
    echo "❌ Git non è installato. Installalo da https://git-scm.com/"
    exit 1
fi

# Inizializza Git se non già fatto
if [ ! -d .git ]; then
    echo "📁 Inizializzazione repository Git..."
    git init
    echo "✅ Repository Git inizializzato"
else
    echo "✅ Repository Git già esistente"
fi

# Aggiungi tutti i file
echo ""
echo "📝 Aggiunta file al commit..."
git add .

# Crea commit
echo ""
echo "💾 Creazione commit..."
git commit -m "Preparazione per deployment online - DicomViewer Web App"

# Chiedi l'URL del repository
echo ""
echo "📮 Inserisci l'URL del tuo repository GitHub"
echo "   (esempio: https://github.com/username/dicom-viewer-web.git)"
read -p "URL: " repo_url

if [ -z "$repo_url" ]; then
    echo "❌ URL non fornito. Operazione annullata."
    exit 1
fi

# Aggiungi remote se non esiste
if ! git remote | grep -q origin; then
    echo ""
    echo "🔗 Collegamento al repository remoto..."
    git remote add origin "$repo_url"
    echo "✅ Remote aggiunto"
else
    echo "✅ Remote già configurato"
fi

# Rinomina branch a main se necessario
current_branch=$(git branch --show-current)
if [ "$current_branch" != "main" ]; then
    echo ""
    echo "🔄 Rinomino branch a 'main'..."
    git branch -M main
fi

# Push su GitHub
echo ""
echo "⬆️  Push su GitHub..."
git push -u origin main

echo ""
echo "✅ ================================"
echo "✅ Repository caricato su GitHub!"
echo "✅ ================================"
echo ""
echo "🎯 Prossimi passi:"
echo "   1. Vai su https://render.com"
echo "   2. Crea un nuovo Web Service"
echo "   3. Connetti il repository $repo_url"
echo "   4. Deploy automatico!"
echo ""
echo "📖 Per maggiori dettagli, consulta DEPLOYMENT.md"
