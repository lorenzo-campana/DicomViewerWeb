# DICOM Viewer Web App

Una web app interattiva per visualizzare e analizzare immagini DICOM con proiezioni trasversali, sagittali e coronali.

## Caratteristiche

- **File Tree**: Navigazione e caricamento di file DICOM da cartelle
- **Tre Proiezioni**: Visualizzazione simultanea di trasversale (axial), sagittale (sagittal) e coronale (coronal)
- **Interattività**:
  - Scorrimento slice con slider
  - Panning (trascinamento) delle immagini
  - Zoom con rotella del mouse
  - Aggiustamento contrasto (window/level) con click e trascinamento
- **UI Moderna**: Interfaccia dark mode con design responsive

## Installazione

1. Installa le dipendenze:
```bash
pip install -r requirements.txt
```

2. Avvia l'app:
```bash
python app.py
```

3. Apri il browser a `http://localhost:5000`

## Utilizzo

1. **Carica File DICOM**:
   - Inserisci un percorso nella barra di input oppure naviga l'albero dei file
   - Clicca su una cartella per caricare tutti i DICOM al suo interno
   - Clicca su un singolo file DICOM per caricarlo

2. **Visualizza Proiezioni**:
   - Tre riquadri mostrano le tre proiezioni ortogonali
   - Usa lo slider per scorrere le slice in ogni proiezione

3. **Interagisci con le Immagini**:
   - **Zoom**: Rotella del mouse
   - **Pan**: Clicca e trascina
   - **Contrasto**: Premi il bottone "Contrasto" e poi clicca/trascina sull'immagine
     - Movimento orizzontale: aggiusta window center (luminosità)
     - Movimento verticale: aggiusta window width (contrasto)

## Struttura Progetto

```
DicomViewer Web/
├── app.py                 # Backend Flask
├── requirements.txt       # Dipendenze Python
├── templates/
│   └── index.html        # Template HTML
└── static/
    ├── css/
    │   └── style.css     # Stili CSS
    └── js/
        └── viewer.js     # Logica frontend
```

## Tecnologie

- **Backend**: Flask, PyDICOM, NumPy, Pillow
- **Frontend**: HTML5 Canvas, Vanilla JavaScript
- **Styling**: CSS3 con dark mode

## Note

- I file DICOM vengono caricati in memoria per performance
- Le immagini vengono normalizzate a 0-255 per la visualizzazione
- Il windowing DICOM è implementato per l'aggiustamento del contrasto

## Deployment Online

L'app è pronta per il deployment su cloud! 🚀

### 📖 Guide Complete

- **[QUICK_START.md](QUICK_START.md)** - Guida rapida in 3 passi
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Guida dettagliata con tutte le opzioni

### 🎯 Deployment Rapido (Raccomandato: Render.com)

1. **Carica il progetto su GitHub**
   ```bash
   git init
   git add .
   git commit -m "Deploy DicomViewer"
   git remote add origin https://github.com/TUO_USERNAME/dicom-viewer.git
   git push -u origin main
   ```

2. **Deploy su Render**
   - Vai su [render.com](https://render.com)
   - Crea nuovo Web Service
   - Connetti repository GitHub
   - Deploy automatico! ✨

3. **La tua app è online!**
   - Ricevi URL: `https://tua-app.onrender.com`
   - Condividi con chi vuoi
   - Accesso da qualsiasi dispositivo

### 🔧 O usa lo script automatico (Windows)

```powershell
.\deploy-setup.ps1
```

### 🌐 Altre opzioni disponibili

- **Railway.app** - $5 credito mensile gratuito, performance eccellenti
- **PythonAnywhere** - Specializzato Python, piano free permanente  
- **Fly.io** - Deployment globale, ottimo piano gratuito

Vedi le guide per tutti i dettagli!


