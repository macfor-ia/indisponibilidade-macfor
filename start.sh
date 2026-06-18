#!/bin/bash
# ═══════════════════════════════════════
# BI Macfor - Start Script
# ═══════════════════════════════════════

export PATH="$HOME/.local/node-v20.11.1-darwin-arm64/bin:$PATH"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║  BI Macfor                               ║"
echo "║  Iniciando servidor...                   ║"
echo "╚══════════════════════════════════════════╝"
echo ""

cd "$(dirname "$0")"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
  echo ">> Instalando dependencias..."
  npm install
fi

# Start
echo ">> Abrindo http://localhost:3000"
echo ">> Para parar, pressione Ctrl+C"
echo ""

# Open browser after a small delay
(sleep 2 && open http://localhost:3000) &

node server.js
