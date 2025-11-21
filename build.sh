#!/bin/bash
# Build script per Render.com
# Questo script risolve problemi comuni con setuptools e dipendenze

echo "🔧 Aggiornamento pip, setuptools e wheel..."
pip install --upgrade pip setuptools wheel

echo "📦 Installazione dipendenze..."
pip install -r requirements.txt

echo "✅ Build completato!"
