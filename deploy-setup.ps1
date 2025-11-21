# Script PowerShell per preparare il deployment su GitHub
# Esegui questo script per inizializzare Git e fare push

Write-Host "🚀 Preparazione deployment DicomViewer Web App" -ForegroundColor Cyan
Write-Host ""

# Controlla se Git è installato
try {
    git --version | Out-Null
    Write-Host "✅ Git trovato" -ForegroundColor Green
} catch {
    Write-Host "❌ Git non è installato. Installalo da https://git-scm.com/" -ForegroundColor Red
    exit 1
}

# Inizializza Git se non già fatto
if (-not (Test-Path -Path ".git")) {
    Write-Host "📁 Inizializzazione repository Git..." -ForegroundColor Yellow
    git init
    Write-Host "✅ Repository Git inizializzato" -ForegroundColor Green
} else {
    Write-Host "✅ Repository Git già esistente" -ForegroundColor Green
}

# Aggiungi tutti i file
Write-Host ""
Write-Host "📝 Aggiunta file al commit..." -ForegroundColor Yellow
git add .

# Crea commit
Write-Host ""
Write-Host "💾 Creazione commit..." -ForegroundColor Yellow
git commit -m "Preparazione per deployment online - DicomViewer Web App"

# Chiedi l'URL del repository
Write-Host ""
Write-Host "📮 Inserisci l'URL del tuo repository GitHub" -ForegroundColor Cyan
Write-Host "   (esempio: https://github.com/username/dicom-viewer-web.git)" -ForegroundColor Gray
$repo_url = Read-Host "URL"

if ([string]::IsNullOrWhiteSpace($repo_url)) {
    Write-Host "❌ URL non fornito. Operazione annullata." -ForegroundColor Red
    exit 1
}

# Controlla se remote esiste
$remotes = git remote
if ($remotes -notcontains "origin") {
    Write-Host ""
    Write-Host "🔗 Collegamento al repository remoto..." -ForegroundColor Yellow
    git remote add origin $repo_url
    Write-Host "✅ Remote aggiunto" -ForegroundColor Green
} else {
    Write-Host "✅ Remote già configurato" -ForegroundColor Green
}

# Rinomina branch a main se necessario
$current_branch = git branch --show-current
if ($current_branch -ne "main") {
    Write-Host ""
    Write-Host "🔄 Rinomino branch a 'main'..." -ForegroundColor Yellow
    git branch -M main
}

# Push su GitHub
Write-Host ""
Write-Host "⬆️  Push su GitHub..." -ForegroundColor Yellow
try {
    git push -u origin main
    
    Write-Host ""
    Write-Host "✅ ================================" -ForegroundColor Green
    Write-Host "✅ Repository caricato su GitHub!" -ForegroundColor Green
    Write-Host "✅ ================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎯 Prossimi passi:" -ForegroundColor Cyan
    Write-Host "   1. Vai su https://render.com" -ForegroundColor White
    Write-Host "   2. Crea un nuovo Web Service" -ForegroundColor White
    Write-Host "   3. Connetti il repository $repo_url" -ForegroundColor White
    Write-Host "   4. Deploy automatico!" -ForegroundColor White
    Write-Host ""
    Write-Host "📖 Per maggiori dettagli, consulta DEPLOYMENT.md" -ForegroundColor Gray
} catch {
    Write-Host ""
    Write-Host "❌ Errore durante il push. Possibili cause:" -ForegroundColor Red
    Write-Host "   - Repository remoto non esiste" -ForegroundColor Yellow
    Write-Host "   - Credenziali non configurate" -ForegroundColor Yellow
    Write-Host "   - URL repository errato" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "💡 Prova a:" -ForegroundColor Cyan
    Write-Host "   1. Creare il repository su GitHub prima" -ForegroundColor White
    Write-Host "   2. Configurare le credenziali Git" -ForegroundColor White
    Write-Host "   3. Verificare l'URL del repository" -ForegroundColor White
}
