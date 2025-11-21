# ✅ Checklist Pre-Deployment

Prima di deployare la tua DicomViewer Web App, assicurati di aver completato tutti questi passaggi:

## 📋 Preparazione File

- [x] **Procfile** - Creato ✅
- [x] **runtime.txt** - Python 3.11.0 specificato ✅
- [x] **requirements.txt** - Gunicorn aggiunto ✅
- [x] **render.yaml** - Configurazione Render pronta ✅
- [x] **.gitignore** - File da escludere configurati ✅
- [x] **app.py** - Modificato per production (PORT dinamica, debug=False) ✅

## 📝 Documentazione

- [x] **DEPLOYMENT.md** - Guida completa disponibile ✅
- [x] **QUICK_START.md** - Guida rapida disponibile ✅
- [x] **README.md** - Aggiornato con sezione deployment ✅
- [x] **deploy-setup.ps1** - Script PowerShell pronto ✅
- [x] **deploy-setup.sh** - Script Bash pronto ✅

## 🔧 Configurazione

- [x] **Port binding** - Configurato con `os.environ.get('PORT')` ✅
- [x] **Debug mode** - Disabilitato per production ✅
- [x] **Host binding** - Configurato su `0.0.0.0` ✅
- [x] **WSGI server** - Gunicorn configurato ✅
- [x] **Workers** - 2 workers configurati in Procfile ✅

## 🎯 Prossimi Passi (Da Fare)

### 1. Setup Git e GitHub

- [ ] **Installare Git** (se non già installato)
  - Download: https://git-scm.com/
  
- [ ] **Creare account GitHub** (se non già presente)
  - Vai su: https://github.com/signup
  
- [ ] **Creare repository su GitHub**
  - Vai su: https://github.com/new
  - Nome suggerito: `dicom-viewer-web`
  - Visibilità: Public o Private (a tua scelta)
  - NON aggiungere README, .gitignore, o license (già presenti localmente)

### 2. Push su GitHub

Scegli uno dei seguenti metodi:

#### Opzione A: Script Automatico (Raccomandato per Windows)

- [ ] Apri PowerShell nella cartella del progetto
- [ ] Esegui: `.\deploy-setup.ps1`
- [ ] Segui le istruzioni a schermo

#### Opzione B: Comandi Manuali

- [ ] Apri terminale/PowerShell nella cartella del progetto
- [ ] Esegui i seguenti comandi:

```bash
# Inizializza repository
git init

# Aggiungi tutti i file
git add .

# Fai il primo commit
git commit -m "Setup iniziale DicomViewer Web App per deployment"

# Aggiungi remote (sostituisci con il TUO URL)
git remote add origin https://github.com/TUO_USERNAME/dicom-viewer-web.git

# Rinomina branch a main
git branch -M main

# Push su GitHub
git push -u origin main
```

### 3. Scegli Piattaforma di Deployment

Scegli UNA delle seguenti opzioni:

#### Opzione A: Render.com (Consigliata - Gratuita)

- [ ] Vai su https://render.com
- [ ] Crea account (usa GitHub per login rapido)
- [ ] Click "New +" → "Web Service"
- [ ] Seleziona il repository `dicom-viewer-web`
- [ ] Render rileva automaticamente configurazione da `render.yaml`
- [ ] Click "Create Web Service"
- [ ] Attendi 2-3 minuti per il deployment
- [ ] Copia il tuo URL: `https://______.onrender.com`

#### Opzione B: Railway.app (Performance Migliori)

- [ ] Vai su https://railway.app
- [ ] Crea account (usa GitHub per login rapido)
- [ ] Click "New Project" → "Deploy from GitHub repo"
- [ ] Seleziona il repository
- [ ] Railway configura automaticamente
- [ ] Click "Deploy"
- [ ] Copia il tuo URL generato

#### Opzione C: PythonAnywhere

- [ ] Vai su https://www.pythonanywhere.com
- [ ] Crea account gratuito
- [ ] Vai su "Web" → "Add a new web app"
- [ ] Scegli "Manual Configuration" → "Python 3.10"
- [ ] Clona repository nella console Bash
- [ ] Configura WSGI file
- [ ] Installa dipendenze
- [ ] Reload app

### 4. Test Post-Deployment

Dopo il deployment, testa le seguenti funzionalità:

- [ ] **Homepage si carica** correttamente
- [ ] **Upload file DICOM** funziona
  - [ ] Upload da file browser
  - [ ] Upload tramite drag & drop
- [ ] **Visualizzazione proiezioni** funziona
  - [ ] Proiezione Axial
  - [ ] Proiezione Sagittal
  - [ ] Proiezione Coronal
- [ ] **Controlli viewer** funzionano
  - [ ] Zoom con rotella mouse
  - [ ] Pan (trascinamento)
  - [ ] Slider slice navigation
  - [ ] Window/Level adjustment
- [ ] **Analisi** funzionano
  - [ ] Gaussian Profile analysis
  - [ ] MTF analysis

### 5. Configurazioni Opzionali

- [ ] **Dominio personalizzato** (se desiderato)
  - Render/Railway permettono domini custom gratuiti
  
- [ ] **Variabili d'ambiente** (se necessario)
  - Aggiungi tramite dashboard della piattaforma
  
- [ ] **Monitoring** (opzionale)
  - Configura alerts per downtime
  
- [ ] **Analytics** (opzionale)
  - Aggiungi Google Analytics o simili

## 🚨 Checklist Sicurezza

Prima di rendere l'app pubblica, considera:

- [ ] **Autenticazione** - L'app NON ha login/password
  - [ ] Accettabile per demo/uso personale
  - [ ] NON accettabile per dati medici sensibili
  
- [ ] **Dati DICOM** - Possono contenere informazioni sensibili
  - [ ] Usa solo file DICOM anonimizzati
  - [ ] NON caricare dati di pazienti reali senza consenso
  
- [ ] **Rate limiting** - Non implementato
  - [ ] Considera di aggiungere se aspetti traffico elevato
  
- [ ] **CORS** - Non configurato
  - [ ] Aggiungi se l'app sarà chiamata da altri domini

## 📌 Note Finali

### Limitazioni Piano Gratuito

**Render.com:**
- ⚠️ App va in "sleep" dopo 15 minuti di inattività
- ⚠️ Primo load dopo sleep richiede ~30-60 secondi
- ⚠️ 750 ore/mese di compute time
- ✅ Sempre gratuito

**Railway.app:**
- ⚠️ $5 credito/mese (sufficiente per basso traffico)
- ⚠️ Se finisce credito, app in pausa fino a mese successivo
- ✅ Nessuno sleep, sempre attiva

**PythonAnywhere:**
- ⚠️ Solo HTTP (no HTTPS) su piano free
- ⚠️ CPU limitata
- ✅ Sempre online

### Quando Considerare Piano a Pagamento

Considera upgrade se:
- 🚦 L'app ha traffico costante (>750h/mese)
- 🏥 Usi per scopi professionali/clinici
- 💾 Hai bisogno di più RAM (>512MB)
- 🔒 Necessiti di features avanzate (autenticazione, backup, etc.)

**Costi tipici:** $7-20/mese per piani base

## ✅ Sei Pronto!

Una volta completati i passi sopra, la tua DicomViewer Web App sarà:
- 🌐 Online e accessibile da qualsiasi dispositivo
- 🔗 Condivisibile tramite URL
- 🚀 Automaticamente aggiornata ad ogni push su GitHub
- 🔒 Su HTTPS (sicuro)

**Buon deployment!** 🎉

---

## 📞 Supporto

Se riscontri problemi:

1. **Consulta le guide:**
   - `QUICK_START.md` - Per procedure base
   - `DEPLOYMENT.md` - Per troubleshooting dettagliato

2. **Controlla i log:**
   - Ogni piattaforma ha una sezione "Logs"
   - Cerca messaggi di errore specifici

3. **Problemi comuni:**
   - "Module not found": Verifica `requirements.txt`
   - "Port binding error": Verifica configurazione PORT in `app.py`
   - "Build failed": Verifica `runtime.txt` e `Procfile`

4. **Community:**
   - Render: https://community.render.com
   - Railway: https://discord.gg/railway
