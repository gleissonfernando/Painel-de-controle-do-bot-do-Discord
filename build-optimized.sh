#!/bin/bash

# Script de build otimizado para ambientes com memória limitada
# Aumenta o heap do Node.js e executa o build em etapas

set -e

echo "🔨 Build Otimizado - Discord Bot Dashboard"
echo "==========================================="

# Limpar build anterior
echo "🧹 Limpando build anterior..."
rm -rf dist

# Aumentar heap do Node.js para 2GB
export NODE_OPTIONS="--max-old-space-size=2048"

echo "📦 Etapa 1: Build do cliente (Vite)..."
npx vite build

echo "📦 Etapa 2: Build do servidor (esbuild)..."
npx esbuild server/_core/index.ts \
  --platform=node \
  --packages=external \
  --bundle \
  --format=esm \
  --outfile=dist/index.js \
  --minify

echo "✅ Build concluído com sucesso!"
echo ""
echo "📁 Arquivos gerados:"
ls -lh dist/
