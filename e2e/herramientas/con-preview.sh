#!/usr/bin/env bash
# Compila, sirve el build con `vite preview` en el puerto 5199, ejecuta un comando y cierra
# el servidor siempre (también si el comando falla). Pensado para el sandbox de 2 GB:
# un solo servidor y, en las herramientas, un solo navegador con una página a la vez.
#   e2e/herramientas/con-preview.sh node e2e/herramientas/auditoria.mjs http://localhost:5199/ /tmp/a.png 390x844 11 3
set -u
cd "$(dirname "$0")/../.."
npm run build >/dev/null 2>&1 || { echo "build fallido"; exit 1; }
node_modules/.bin/vite preview --port 5199 --strictPort >/dev/null 2>&1 &
VP=$!
trap 'kill $VP 2>/dev/null; wait $VP 2>/dev/null' EXIT
for _ in $(seq 1 30); do curl -s -o /dev/null http://localhost:5199/ && break; sleep 0.2; done
"$@"
