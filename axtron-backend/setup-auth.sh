#!/bin/bash

echo "🔐 CONFIGURANDO AUTENTICAÇÃO ADMIN..."
echo ""

cd /root/axtron/axtron-backend

# ========================================
# 1. GERAR HASH DE SENHA
# ========================================
echo "1️⃣ Gerando hash de senha para admin..."

# Senha padrão: admin
ADMIN_PASSWORD="admin"

# Gerar hash bcrypt
HASH=$(node -e "
const bcrypt = require('bcrypt');
bcrypt.hash('$ADMIN_PASSWORD', 10).then(hash => {
  console.log(hash);
  process.exit(0);
}).catch(err => {
  console.error('Erro:', err);
  process.exit(1);
});
")

if [ -z "$HASH" ]; then
    echo "❌ Erro ao gerar hash"
    exit 1
fi

echo "✅ Hash gerado: ${HASH:0:20}..."

# ========================================
# 2. ATUALIZAR .ENV
# ========================================
echo ""
echo "2️⃣ Atualizando .env com hash de senha..."

# Remover linha antiga
sed -i '/ADMIN_PASS_HASH=/d' .env

# Adicionar nova linha
echo "ADMIN_PASS_HASH=$HASH" >> .env

echo "✅ .env atualizado"

# ========================================
# 3. COPIAR LOGIN.HTML
# ========================================
echo ""
echo "3️⃣ Atualizando página de login..."

if [ -f "/tmp/login.html" ]; then
    cp /tmp/login.html public/login.html
    echo "✅ login.html atualizado"
else
    echo "⚠️  Arquivo login.html não encontrado em /tmp"
    echo "    Copie manualmente para public/login.html"
fi

# ========================================
# 4. COPIAR ADMIN.HTML (se existir)
# ========================================
echo ""
echo "4️⃣ Verificando admin.html..."

if [ -f "/tmp/admin.html" ]; then
    cp /tmp/admin.html public/admin.html
    echo "✅ admin.html atualizado"
else
    echo "⚠️  Arquivo admin.html não encontrado em /tmp"
fi

# ========================================
# 5. VERIFICAR ARQUIVOS
# ========================================
echo ""
echo "5️⃣ Verificando arquivos..."

if [ -f "public/login.html" ]; then
    SIZE=$(du -h public/login.html | cut -f1)
    echo "✅ login.html: $SIZE"
else
    echo "❌ login.html não encontrado"
fi

if [ -f "public/admin.html" ]; then
    SIZE=$(du -h public/admin.html | cut -f1)
    echo "✅ admin.html: $SIZE"
else
    echo "❌ admin.html não encontrado"
fi

# ========================================
# 6. REINICIAR PM2
# ========================================
echo ""
echo "6️⃣ Reiniciando servidor..."

pm2 restart desejoshot
sleep 2
pm2 logs desejoshot --lines 5 --nostream

# ========================================
# RESUMO
# ========================================
echo ""
echo "=========================================="
echo "✅ AUTENTICAÇÃO CONFIGURADA!"
echo "=========================================="
echo ""
echo "📋 CREDENCIAIS:"
echo "   Usuário: admin"
echo "   Senha: admin"
echo ""
echo "🌐 ACESSAR:"
echo "   http://187.77.35.230:4001/login.html"
echo ""
echo "   Após login, será redirecionado para:"
echo "   http://187.77.35.230:4001/admin.html"
echo ""
echo "=========================================="
