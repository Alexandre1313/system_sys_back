#!/bin/bash

APP_DIR="/home/xandy/projects/back_end/project-beck_ventura"
SERVICE_NAME="backend.service"

echo "➡️  Entrando no diretório do app..."
cd "$APP_DIR" || exit 1

# ⚠️ Descomente esta linha só se você tiver alterado dependências
# echo "📦 Instalando dependências..."
# npm install

echo "🏗️  Rodando build..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build feito com sucesso."
    echo "♻️  Reiniciando serviço..."
    sudo systemctl daemon-reload  # só por garantia
    sudo systemctl restart "$SERVICE_NAME"
    echo "✅ System listening in http://192.168.1.169:4997 port 4997."
else
    echo "❌ Erro no build. Serviço não foi reiniciado."
    exit 1
fi
