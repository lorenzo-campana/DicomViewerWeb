# Guida al Deployment - DicomViewer Web App

## 📋 Preparazione Completata

I seguenti file sono stati aggiunti/modificati per rendere l'app pronta al deployment:

- ✅ `Procfile` - Istruzioni per avviare l'app su piattaforme cloud
- ✅ `runtime.txt` - Specifica la versione di Python
- ✅ `requirements.txt` - Aggiunto gunicorn (server WSGI per produzione)
- ✅ `app.py` - Modificato per supportare PORT dinamica e production mode
- ✅ `.gitignore` - Per escludere file non necessari da Git

---

## 🚀 OPZIONE 1: Render.com (CONSIGLIATA)

### Vantaggi:
- ✅ Gratuito per sempre (con alcune limitazioni)
- ✅ Deploy automatico da GitHub
- ✅ SSL certificate gratuito
- ✅ Facile da configurare

### Passi per il deployment:

#### 1. Prepara il repository GitHub

```bash
# Inizializza Git (se non già fatto)
git init

# Aggiungi tutti i file
git add .

# Fai il primo commit
git commit -m "Preparazione per deployment su Render"

# Crea un repository su GitHub e collegalo
git remote add origin https://github.com/TUO_USERNAME/dicom-viewer-web.git
git branch -M main
git push -u origin main
```

#### 2. Deploy su Render

1. Vai su [render.com](https://render.com) e crea un account
2. Clicca **"New +"** → **"Web Service"**
3. Connetti il tuo repository GitHub
4. Configura:
   - **Name**: `dicom-viewer-web` (o come preferisci)
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app --bind 0.0.0.0:$PORT --timeout 120 --workers 2`
   - **Instance Type**: `Free`

5. Clicca **"Create Web Service"**

🎉 L'app sarà disponibile su `https://dicom-viewer-web.onrender.com` (o il nome che hai scelto)

#### ⚠️ Limitazioni del piano gratuito Render:
- L'app va in "sleep" dopo 15 minuti di inattività
- Il primo caricamento dopo lo sleep può richiedere 30-60 secondi
- 750 ore/mese di utilizzo gratuito

---

## 🚀 OPZIONE 2: Railway.app

### Vantaggi:
- ✅ $5 di credito gratuito al mese
- ✅ Deploy ancora più semplice
- ✅ Migliori performance del piano gratuito
- ✅ Non va in sleep come Render

### Passi per il deployment:

#### 1. Prepara il repository GitHub (come sopra)

#### 2. Deploy su Railway

1. Vai su [railway.app](https://railway.app) e crea un account
2. Clicca **"New Project"** → **"Deploy from GitHub repo"**
3. Seleziona il tuo repository
4. Railway rileva automaticamente che è un'app Flask
5. Clicca **"Deploy"**

🎉 L'app sarà disponibile su un URL generato automaticamente

#### Nota:
- Railway offre $5 di credito gratuito al mese
- Quando finisce il credito, l'app va in pausa fino al mese successivo
- Puoi aggiungere un dominio personalizzato gratuitamente

---

## 🚀 OPZIONE 3: PythonAnywhere

### Vantaggi:
- ✅ Specializzato in applicazioni Python
- ✅ Piano gratuito permanente
- ✅ Supporto eccellente per Flask

### Passi per il deployment:

1. Crea un account su [pythonanywhere.com](https://www.pythonanywhere.com)
2. Vai su **"Web"** → **"Add a new web app"**
3. Scegli **"Flask"** e **"Python 3.10"**
4. Carica i tuoi file o clona da Git:
   ```bash
   git clone https://github.com/TUO_USERNAME/dicom-viewer-web.git
   ```
5. Installa le dipendenze nel virtual environment:
   ```bash
   pip install -r requirements.txt
   ```
6. Configura il WSGI file per puntare alla tua app
7. Clicca **"Reload"**

🎉 L'app sarà disponibile su `https://TUO_USERNAME.pythonanywhere.com`

#### ⚠️ Limitazioni del piano gratuito PythonAnywhere:
- Solo HTTP (no HTTPS) nel piano gratuito
- CPU limitata
- Non può accedere a siti esterni (API restrictions)

---

## 🚀 OPZIONE 4: Fly.io

### Vantaggi:
- ✅ Ottimo piano gratuito
- ✅ Deployment globale (edge locations)
- ✅ Ottima documentazione

### Passi per il deployment:

1. Installa Fly CLI:
   ```bash
   # Windows (PowerShell)
   iwr https://fly.io/install.ps1 -useb | iex
   ```

2. Login e setup:
   ```bash
   fly auth login
   fly launch
   ```

3. Segui il wizard interattivo

🎉 Deploy automatico!

---

## 🔧 Considerazioni Importanti

### 1. **Dimensione dei file DICOM**
L'app attualmente carica file DICOM in memoria. Per un uso in produzione, considera:
- Limitare la dimensione massima dei file
- Implementare storage su disco o cloud (S3, Google Cloud Storage)
- Aggiungere cleanup automatico dei file vecchi

### 2. **Sicurezza**
- ⚠️ Attualmente l'app non ha autenticazione
- ⚠️ I file DICOM potrebbero contenere dati sensibili (PHI/PII)
- Considera di aggiungere autenticazione se l'app sarà pubblica

### 3. **Performance**
- Il piano gratuito ha RAM limitata (512MB - 1GB)
- File DICOM grandi potrebbero causare out-of-memory
- Monitora l'uso delle risorse dopo il deployment

---

## 📝 Comandi Git Rapidi

```bash
# Prima volta
git init
git add .
git commit -m "Initial commit - DicomViewer Web"

# Crea repo su GitHub, poi:
git remote add origin https://github.com/TUO_USERNAME/NOME_REPO.git
git branch -M main
git push -u origin main

# Aggiornamenti futuri
git add .
git commit -m "Descrizione modifiche"
git push
```

---

## 🎯 Raccomandazione Finale

**Per iniziare, ti consiglio Render.com:**
1. È completamente gratuito
2. Il deployment è automatico da GitHub
3. Hai SSL/HTTPS gratis
4. È facile da configurare

**Se ti piace e vuoi performance migliori:**
- Passa a Railway.app ($5/mese coprono un buon utilizzo)
- Oppure passa al piano a pagamento di Render ($7/mese)

---

## ❓ Problemi Comuni

### "Application error" o "Failed to bind to $PORT"
- Assicurati che `app.py` usi `os.environ.get('PORT')`
- Verifica che `Procfile` sia corretto

### "Module not found"
- Controlla che `requirements.txt` contenga tutte le dipendenze
- Verifica la versione di Python in `runtime.txt`

### "Out of memory"
- Riduci il numero di workers in `Procfile`
- Limita la dimensione massima dei file DICOM
- Passa a un piano a pagamento con più RAM

---

## 📞 Prossimi Passi

1. Scegli una piattaforma (consiglio Render)
2. Crea un repository GitHub
3. Segui i passi per il deployment
4. Testa l'applicazione online
5. (Opzionale) Configura un dominio personalizzato

Buon deployment! 🚀
