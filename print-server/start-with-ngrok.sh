#!/bin/bash

# Script para iniciar el servidor de impresión con ngrok

echo "🖨️  Iniciando servidor de impresión..."
echo ""

# Verificar si ngrok está instalado
if ! command -v ngrok &> /dev/null
then
    echo "❌ ngrok no está instalado"
    echo ""
    echo "Instálalo con:"
    echo "  brew install ngrok/ngrok/ngrok"
    echo ""
    echo "O descárgalo de: https://ngrok.com/download"
    exit 1
fi

# Iniciar el servidor Node.js en segundo plano
echo "📡 Iniciando servidor Node.js en puerto 3001..."
node server.js &
SERVER_PID=$!

# Esperar 2 segundos para que el servidor inicie
sleep 2

# Verificar que el servidor esté corriendo
if ! ps -p $SERVER_PID > /dev/null; then
   echo "❌ Error: El servidor no pudo iniciarse"
   exit 1
fi

echo "✅ Servidor iniciado (PID: $SERVER_PID)"
echo ""

# Iniciar ngrok
echo "🌐 Iniciando ngrok..."
echo ""
echo "⚠️  IMPORTANTE: Copia la URL 'Forwarding' que aparece abajo"
echo "   y agrégala como variable de entorno en Vercel:"
echo "   NEXT_PUBLIC_PRINT_SERVER_URL=https://tu-url.ngrok.io"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

ngrok http 3001

# Cuando ngrok se cierre, matar el servidor
echo ""
echo "🛑 Deteniendo servidor..."
kill $SERVER_PID
echo "✅ Servidor detenido"
