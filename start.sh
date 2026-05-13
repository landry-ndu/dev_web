#!/bin/bash
# GameBizarre - Serveur local

echo ""
echo " =========================================="
echo "  Demarrage de GameBizarre..."
echo " =========================================="
echo ""

if command -v python3 >/dev/null 2>&1; then
    PY=python3
elif command -v python >/dev/null 2>&1; then
    PY=python
else
    echo " [ERREUR] Python n'est pas installe."
    echo " Installe-le depuis https://python.org"
    exit 1
fi

echo " Python detecte : $PY"
echo " Site accessible sur : http://localhost:8000"
echo ""
echo " Ctrl+C pour arreter le serveur."
echo ""

# Ouvre le navigateur en arriere-plan
( sleep 1.5
  if command -v open >/dev/null;    then open http://localhost:8000
  elif command -v xdg-open >/dev/null; then xdg-open http://localhost:8000
  fi ) &

$PY -m http.server 8000
