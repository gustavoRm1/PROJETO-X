#!/bin/bash

# ========================================
# SCRIPT DE SETUP DESEJOSHOT - VPS
# ========================================

echo "🚀 Iniciando setup do DesejosHot..."

# ========================================
# 1. ATUALIZAR SISTEMA
# ========================================
echo ""
echo "📦 Atualizando sistema..."
sudo apt update && sudo apt upgrade -y

# ========================================
# 2. INSTALAR DEPENDÊNCIAS
# ========================================
echo ""
echo "📦 Instalando dependências do sistema..."

# MySQL
if ! command -v mysql &> /dev/null; then
    echo "Instalando MySQL..."
    sudo apt install -y mysql-server
else
    echo "✅ MySQL já instalado"
fi

# Redis
if ! command -v redis-cli &> /dev/null; then
    echo "Instalando Redis..."
    sudo apt install -y redis-server
    sudo systemctl enable redis-server
    sudo systemctl start redis-server
else
    echo "✅ Redis já instalado"
fi

# FFmpeg
if ! command -v ffmpeg &> /dev/null; then
    echo "Instalando FFmpeg..."
    sudo apt install -y ffmpeg
else
    echo "✅ FFmpeg já instalado"
fi

# libvips (para Sharp)
if ! dpkg -l | grep -q libvips; then
    echo "Instalando libvips..."
    sudo apt install -y libvips-dev
else
    echo "✅ libvips já instalado"
fi

# ========================================
# 3. VERIFICAR NODE.JS
# ========================================
echo ""
echo "🔍 Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado!"
    echo "Instale Node.js 18+ antes de continuar:"
    echo "curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
    echo "sudo apt install -y nodejs"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js versão $NODE_VERSION é muito antiga. Necessário >= 18"
    exit 1
fi

echo "✅ Node.js $(node -v) OK"

# ========================================
# 4. CONFIGURAR MYSQL
# ========================================
echo ""
echo "🗄️  Configurando MySQL..."

# Pedir senha para MySQL
read -sp "Digite a senha para o usuário 'desejoshot_user' no MySQL: " MYSQL_PASSWORD
echo ""

# Criar banco e usuário
sudo mysql -e "CREATE DATABASE IF NOT EXISTS desejoshot_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null
sudo mysql -e "CREATE USER IF NOT EXISTS 'desejoshot_user'@'localhost' IDENTIFIED BY '$MYSQL_PASSWORD';" 2>/dev/null
sudo mysql -e "GRANT ALL PRIVILEGES ON desejoshot_db.* TO 'desejoshot_user'@'localhost';" 2>/dev/null
sudo mysql -e "FLUSH PRIVILEGES;" 2>/dev/null

echo "✅ Banco de dados criado"

# Aplicar schema SQL
if [ -f "sql/mysql_schema_v2.sql" ]; then
    echo "Aplicando schema SQL..."
    mysql -u desejoshot_user -p"$MYSQL_PASSWORD" desejoshot_db < sql/mysql_schema_v2.sql
    echo "✅ Schema aplicado"
else
    echo "⚠️  Arquivo sql/mysql_schema_v2.sql não encontrado!"
    echo "Execute manualmente: mysql -u desejoshot_user -p desejoshot_db < sql/mysql_schema_v2.sql"
fi

# ========================================
# 5. CRIAR ESTRUTURA DE PASTAS
# ========================================
echo ""
echo "📁 Criando estrutura de pastas..."

sudo mkdir -p /var/www/desejoshot/uploads/{videos,frames,audio}
sudo mkdir -p /var/www/desejoshot/thumbs
sudo mkdir -p /var/www/desejoshot/temp
sudo mkdir -p /var/www/desejoshot/public/sitemap
sudo mkdir -p logs

# Permissões
sudo chown -R $USER:$USER /var/www/desejoshot
sudo chmod -R 755 /var/www/desejoshot

echo "✅ Pastas criadas"

# ========================================
# 6. INSTALAR DEPENDÊNCIAS NPM
# ========================================
echo ""
echo "📦 Instalando dependências do Node.js..."

if [ ! -d "node_modules" ]; then
    npm install
else
    echo "✅ node_modules já existe, pulando..."
fi

# ========================================
# 7. CONFIGURAR .ENV
# ========================================
echo ""
echo "⚙️  Configurando .env..."

if [ ! -f ".env" ]; then
    echo "Criando .env..."
    
    # Gerar JWT Secret aleatório
    JWT_SECRET=$(openssl rand -hex 32)
    
    cat > .env << EOF
# ========================================
# DESEJOSHOT - CONFIGURAÇÃO
# ========================================

PORT=4000

# GEMINI AI (OBRIGATÓRIO - obter em: https://aistudio.google.com/app/apikey)
GEMINI_API_KEY=

# MYSQL
DB_HOST=127.0.0.1
DB_USER=desejoshot_user
DB_PASS=$MYSQL_PASSWORD
DB_NAME=desejoshot_db

# REDIS
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# CAMINHOS
UPLOAD_PATH=/var/www/desejoshot/uploads
THUMB_PATH=/var/www/desejoshot/thumbs
TEMP_PATH=/var/www/desejoshot/temp

# SEO
SITE_URL=http://187.77.35.230
SUPPORTED_LOCALES=pt,en,es,fr,de,it,ru,ja,ar,hi

# PROCESSAMENTO
MAX_CONCURRENT_JOBS=3
BATCH_SIZE=10

# SEGURANÇA
JWT_SECRET=$JWT_SECRET
ADMIN_USER=admin
ADMIN_PASS_HASH=

# CORS
CORS_ORIGIN=http://187.77.35.230,http://localhost:4000
EOF

    echo "✅ .env criado"
else
    echo "⚠️  .env já existe, não sobrescrevendo"
fi

# ========================================
# 8. GERAR HASH DE SENHA ADMIN
# ========================================
echo ""
echo "🔐 Gerando hash de senha admin..."
read -sp "Digite a senha para o admin: " ADMIN_PASSWORD
echo ""

ADMIN_HASH=$(node -e "const bcrypt = require('bcrypt'); bcrypt.hash('$ADMIN_PASSWORD', 10).then(hash => console.log(hash))")

# Adicionar ao .env
sed -i "s|ADMIN_PASS_HASH=|ADMIN_PASS_HASH=$ADMIN_HASH|g" .env

echo "✅ Hash de senha configurado"

# ========================================
# 9. VERIFICAR SERVIÇOS
# ========================================
echo ""
echo "🔍 Verificando serviços..."

# Redis
if redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis: OK"
else
    echo "❌ Redis: FALHOU"
fi

# MySQL
if mysql -u desejoshot_user -p"$MYSQL_PASSWORD" -e "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ MySQL: OK"
else
    echo "❌ MySQL: FALHOU"
fi

# FFmpeg
if ffmpeg -version > /dev/null 2>&1; then
    echo "✅ FFmpeg: OK"
else
    echo "❌ FFmpeg: FALHOU"
fi

# ========================================
# 10. FINALIZAÇÃO
# ========================================
echo ""
echo "=========================================="
echo "✅ SETUP COMPLETO!"
echo "=========================================="
echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo ""
echo "1. Obter sua GEMINI_API_KEY:"
echo "   - Acesse: https://aistudio.google.com/app/apikey"
echo "   - Copie a chave"
echo "   - Edite .env e cole a chave em GEMINI_API_KEY="
echo ""
echo "2. Testar o servidor:"
echo "   npm start"
echo ""
echo "3. Acessar:"
echo "   - Site: http://187.77.35.230:4000"
echo "   - Admin: http://187.77.35.230:4000/admin.html"
echo ""
echo "4. (Opcional) Rodar com PM2:"
echo "   pm2 start server.js --name desejoshot"
echo "   pm2 save"
echo "   pm2 startup"
echo ""
echo "=========================================="
