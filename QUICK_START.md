# 🎯 Quick Start - Deployment DicomViewer

## ✅ File Pronti per il Deployment

La tua app è ora pronta per il deployment! Ho aggiunto:

📄 **File di configurazione:**
- `Procfile` - Istruzioni per avviare l'app
- `runtime.txt` - Versione Python (3.11.0)
- `requirements.txt` - Dipendenze (aggiunto gunicorn)
- `render.yaml` - Configurazione automatica per Render
- `.gitignore` - File da escludere da Git

📝 **Documentazione:**
- `DEPLOYMENT.md` - Guida completa al deployment
- `README.md` - Aggiornato con sezione deployment

🔧 **Script helper:**
- `deploy-setup.ps1` - Script PowerShell per Windows
- `deploy-setup.sh` - Script Bash per Linux/Mac

⚙️ **Modifiche al codice:**
- `app.py` - Configurato per PORT dinamica e production mode

---

## 🚀 Deploy in 3 Passi (Render.com)

### Opzione A: Usando lo script automatico (Windows)

```powershell
# Apri PowerShell nella cartella del progetto
.\deploy-setup.ps1
```

Lo script ti guiderà attraverso tutto il processo!

### Opzione B: Manualmente

#### 1️⃣ Carica su GitHub

```bash
git init
git add .
git commit -m "Deploy DicomViewer Web App"

# Crea un repository su github.com, poi:
git remote add origin https://github.com/TUO_USERNAME/dicom-viewer.git
git branch -M main
git push -u origin main
```

#### 2️⃣ Deploy su Render

1. Vai su **[render.com](https://render.com)** e crea un account
2. Click **"New +"** → **"Web Service"**
3. Connetti il tuo repository GitHub
4. Render rileva automaticamente la configurazione da `render.yaml`
5. Click **"Create Web Service"**

#### 3️⃣ Aspetta il deployment

- ⏱️ Il primo deployment richiede 2-3 minuti
- 🎉 Riceverai un URL tipo `https://dicom-viewer-xyz.onrender.com`
- ✅ L'app è online e funzionante!

---

## 🌐 Alternative a Render

| Piattaforma | Gratuità | Velocità | Difficoltà |
|-------------|----------|----------|------------|
| **Render.com** | ✅ Sempre gratuito* | ⭐⭐⭐ | ⭐ Facile |
| **Railway.app** | ⚠️ $5 credito/mese | ⭐⭐⭐⭐⭐ | ⭐ Facile |
| **PythonAnywhere** | ✅ Piano free | ⭐⭐ | ⭐⭐ Media |
| **Fly.io** | ✅ Piano free | ⭐⭐⭐⭐ | ⭐⭐⭐ Avanzato |

*Sleep dopo 15 min inattività

Vedi **DEPLOYMENT.md** per istruzioni dettagliate su ogni piattaforma.

---

## 📱 Dopo il Deployment

### Testa l'applicazione

1. Apri l'URL fornito dalla piattaforma
2. Carica alcuni file DICOM di test
3. Verifica che tutte le funzionalità funzionino:
   - ✅ Upload file
   - ✅ Visualizzazione 3 proiezioni
   - ✅ Zoom e pan
   - ✅ Analisi Gaussian
   - ✅ Analisi MTF

### Aggiungi dominio personalizzato (Opzionale)

Render/Railway permettono di aggiungere un dominio personalizzato gratuitamente!

Esempio: `dicom.tuodominio.com`

---

## ⚠️ Note Importanti

### Sicurezza
- 🔒 L'app NON ha autenticazione
- ⚠️ Chiunque con il link può accedere
- 🏥 Non caricare dati medici sensibili senza autenticazione

### Performance
- 💾 Piano gratuito: 512MB RAM
- 📦 File DICOM grandi potrebbero causare problemi
- 💡 Considera upgrade a pagamento per uso intensivo

### Privacy DICOM
I file DICOM spesso contengono:
- 👤 Nomi pazienti
- 📅 Date di nascita
- 🏥 Informazioni mediche

**Raccomandazione:** Anonimizza i file prima del caricamento se l'app è pubblica!

---

## 🆘 Aiuto

### Problemi comuni:

**"Application error"**
- Controlla i log su Render
- Verifica che tutte le dipendenze siano in `requirements.txt`

**"Out of memory"**
- File DICOM troppo grandi
- Riduci workers in `Procfile`
- Passa a piano a pagamento

**"Build failed"**
- Controlla la versione Python in `runtime.txt`
- Verifica sintassi in `Procfile`

### Ulteriore supporto:
- 📖 Leggi `DEPLOYMENT.md` per dettagli completi
- 💬 Consulta la documentazione della piattaforma scelta
- 🐛 Controlla i log per messaggi di errore specifici

---

## 🎉 Complimenti!

Hai preparato con successo la tua app per il deployment! 

Seguendo i passi sopra, la tua **DicomViewer Web App** sarà online e accessibile da qualsiasi dispositivo in pochi minuti.

**Buon deployment!** 🚀
