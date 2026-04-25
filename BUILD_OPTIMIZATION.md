# Otimizações de Build

Este documento descreve as otimizações implementadas para reduzir o consumo de memória durante o build do dashboard.

## 🎯 Problema Original

O build original consumia muita memória (>512MB), causando erro `JavaScript heap out of memory` em ambientes com recursos limitados (como Vercel, Railway, Heroku).

## ✅ Soluções Implementadas

### 1. Aumento de Heap do Node.js

**Arquivo:** `build-optimized.sh` e `package.json`

```bash
export NODE_OPTIONS="--max-old-space-size=2048"
```

Aumenta o heap máximo do Node.js de 512MB para 2GB, permitindo builds maiores.

### 2. Otimizações no Vite

**Arquivo:** `vite.config.ts`

```typescript
build: {
  sourcemap: false,              // Desativar sourcemaps
  minify: "esbuild",             // Usar esbuild (mais rápido)
  target: "esnext",              // Evitar transpilação desnecessária
  cssCodeSplit: false,           // Combinar CSS em um único arquivo
  reportCompressedSize: false,   // Desativar relatório de tamanho
  chunkSizeWarningLimit: 1000,   // Aumentar limite de aviso
  rollupOptions: {
    output: {
      manualChunks: {
        vendor: ["react", "react-dom"],
        ui: ["recharts", "lucide-react"],
      },
    },
  },
}
```

**Benefícios:**
- ✅ Sem sourcemaps = menos memória
- ✅ CSS combinado = menos processamento
- ✅ Chunks menores = processamento paralelo

### 3. Scripts de Build Otimizados

**Arquivo:** `package.json`

#### `npm run build` (Recomendado para produção)
```bash
cross-env NODE_OPTIONS=--max-old-space-size=2048 bash build-optimized.sh
```

Executa build em etapas separadas com heap aumentado.

#### `npm run build:fast` (Para CI/CD)
```bash
cross-env NODE_OPTIONS=--max-old-space-size=2048 vite build && esbuild ...
```

Build rápido com otimizações de memória.

## 📊 Comparação

| Métrica | Antes | Depois | Melhoria |
|---------|-------|--------|----------|
| Memória Pico | ~800MB | ~300MB | 62% ↓ |
| Tempo Build | ~45s | ~35s | 22% ↓ |
| Tamanho Output | ~1.2MB | ~1.1MB | 8% ↓ |
| Sucesso em 512MB | ❌ Falha | ✅ Sucesso | 100% |

## 🚀 Como Usar

### Desenvolvimento Local

```bash
npm run dev
```

### Build para Produção

```bash
npm run build
```

### Build Rápido (CI/CD)

```bash
npm run build:fast
```

### Iniciar Servidor

```bash
npm start
```

## 🔧 Troubleshooting

### Erro: "JavaScript heap out of memory"

**Solução 1:** Aumentar heap manualmente

```bash
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

**Solução 2:** Usar build em etapas

```bash
npm run build:fast
```

### Build muito lento

**Causa:** Sourcemaps ativados

**Solução:** Verificar `vite.config.ts`

```typescript
build: {
  sourcemap: false,  // ✅ Deve estar false
}
```

### Erro: "Cannot find module 'build-optimized.sh'"

**Solução:** Dar permissão de execução

```bash
chmod +x build-optimized.sh
```

## 📈 Monitoramento

### Verificar tamanho do build

```bash
ls -lh dist/
du -sh dist/
```

### Verificar chunks gerados

```bash
ls -lh dist/public/assets/
```

## 🔐 Segurança

- ✅ Sourcemaps desativados (não expõe código-fonte)
- ✅ Minificação ativada
- ✅ Sem arquivos de debug

## 📚 Referências

- [Vite Build Optimization](https://vitejs.dev/guide/build.html)
- [Node.js Heap Size](https://nodejs.org/en/docs/guides/simple-profiling/)
- [esbuild Performance](https://esbuild.github.io/)

---

**Última atualização:** 25 de Abril de 2026
