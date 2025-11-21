# 🚨 Configurazione Manuale Render Dashboard

## ⚠️ Se render.yaml Non Funziona

Render sembra ignorare le configurazioni nel file. Prova questo approccio:

---

## 🎯 Configurazione Manuale su Render Dashboard

### 1. Vai su Render Dashboard

1. Login su https://dashboard.render.com
2. Seleziona il tuo servizio `dicom-viewer-web`
3. Vai su **Settings**

---

### 2. **Environment**

Trova la sezione **Environment** e imposta:

**Language:** `Python`

**Python Version:** Scegli dal dropdown:
- Seleziona: **Python 3.11.9** (o la versione 3.11 più recente disponibile)

Se non c'è 3.11.9, prova:
- `3.11.5`
- `3.11.0`  
- `3.10.13` (fallback sicuro)

---

### 3. **Build & Deploy**

Trova la sezione **Build & Deploy**:

**Build Command:**
```bash
python --version && pip install --upgrade pip setuptools wheel && pip install --only-binary=:all: -r requirements.txt || pip install -r requirements.txt
```

**Start Command:**
```bash
gunicorn app:app --bind 0.0.0.0:$PORT --timeout 120 --workers 2
```

---

### 4. **Environment Variables**

Aggiungi queste variabili nella sezione **Environment Variables**:

| Key | Value |
|-----|-------|
| `PYTHON_VERSION` | `3.11.9` |
| `POETRY_VERSION` | `none` |
| `PIP_NO_BUILD_ISOLATION` | `false` |

Click **Add Environment Variable** per ognuna.

---

### 5. **Disabilita Auto-Deploy (Temporaneo)**

Nella sezione **Auto-Deploy**:
- Disabilita temporaneamente "Auto-Deploy"
- Questo ti permette di configurare tutto prima di fare deploy

---

### 6. **Salva Modifiche**

1. Scorri in basso
2. Click **Save Changes** per OGNI sezione modificata
3. Aspetta che le modifiche vengano salvate

---

### 7. **Manual Deploy con Build Cache Clear**

1. Vai sulla tab **Manual Deploy**
2. Seleziona **"Clear build cache & deploy"** ✅
3. Click **Deploy**

Questo:
- ✅ Cancella cache vecchia
- ✅ Forza riconoscimento nuove impostazioni
- ✅ Usa la versione Python corretta

---

## 📊 Cosa Controllare nel Build Log

Dopo aver cliccato Deploy, monitora il log:

### ✅ Successo - Dovresti Vedere:

```
==> Installing Python version 3.11.9...
==> Using Python version 3.11.9
Python 3.11.9
==> Running build command...
Successfully upgraded pip setuptools wheel
Collecting Flask==3.0.3
Collecting numpy==1.26.4
  Downloading numpy-1.26.4-cp311-cp311-manylinux_2_17_x86_64.whl
                                 ^^^^^ Wheel pre-compilata!
...
Successfully installed Flask-3.0.3 numpy-1.26.4 scipy-1.14.1 ...
==> Build successful 🎉
```

### ❌ Se Ancora Vedi Python 3.13:

```
==> Using Python version 3.13.x
```

Allora:
1. Prova a cambiare Python version a **3.10.13**
2. Oppure considera un'altra piattaforma (Railway, Fly.io)

---

## 🔄 Alternative alla Versione Python

Se 3.11.9 continua a dare problemi:

### Opzione 1: Python 3.10.13 (Molto Stabile)

**Dashboard Settings:**
- Python Version: `3.10.13`

**Environment Variable:**
- `PYTHON_VERSION` = `3.10.13`

**runtime.txt:**
```txt
python-3.10.13
```

### Opzione 2: Python 3.12 (Più Recente)

**Dashboard Settings:**
- Python Version: `3.12.x` (la più recente nel dropdown)

**Environment Variable:**
- `PYTHON_VERSION` = `3.12.0`

**requirements.txt** - Aggiorna scipy:
```txt
scipy==1.14.1
```

---

## 🆘 Piano B: Usa Railway.app

Se Render continua a dare problemi con Python version:

### Railway.app Setup

1. Vai su https://railway.app
2. Crea account (usa GitHub login)
3. "New Project" → "Deploy from GitHub repo"
4. Seleziona il repository
5. Railway RISPETTA runtime.txt meglio di Render
6. Deploy automatico!

**Vantaggi Railway:**
- ✅ Rispetta runtime.txt senza problemi
- ✅ $5 credito gratuito/mese
- ✅ Nessuno sleep mode
- ✅ Build più veloci

---

## 📋 Checklist Configurazione Manuale

- [ ] Login Render Dashboard
- [ ] Settings → Environment → Python 3.11.9
- [ ] Settings → Build Command aggiornato
- [ ] Settings → Start Command aggiornato
- [ ] Environment Variables aggiunte (3 variabili)
- [ ] Salvare TUTTE le modifiche
- [ ] Manual Deploy → Clear build cache & deploy
- [ ] Monitorare build log
- [ ] Verificare che usi Python 3.11.x
- [ ] Build completato con successo

---

## 🎯 Probabilità di Successo

| Metodo | Probabilità |
|--------|-------------|
| Config manuale Dashboard + Python 3.11.9 | 85% |
| Config manuale Dashboard + Python 3.10.13 | 95% |
| Cambiare a Railway.app | 99% |

---

## 💡 Tip Importante

**Render a volte ha bug** con il riconoscimento di `runtime.txt` o `render.yaml`.

La configurazione manuale tramite Dashboard **bypassa questi bug** e ha più probabilità di funzionare.

---

## 📞 Supporto Extra

Se NIENTE di questo funziona:

1. **Render Community:**
   - https://community.render.com
   - Cerca "Python version ignored"
   
2. **Contatta Support:**
   - Dashboard → Help → Contact Support
   - Spiega che runtime.txt viene ignorato

3. **Prova Railway:**
   - È più semplice e stabile per Python apps
   - Deployment in 2 minuti

---

## ✅ Prossimo Passo ADESSO

**Fai questo PRIMA di pushare altro codice:**

1. Vai su Render Dashboard
2. Configura manualmente come sopra
3. Manual Deploy con "Clear build cache"
4. Se funziona → Ottimo!
5. Se non funziona → Prova Python 3.10.13
6. Se ancora no → Passa a Railway.app

**Non fare altro push su GitHub finché non funziona con config manuale!**
