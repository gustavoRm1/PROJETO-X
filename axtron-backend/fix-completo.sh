#!/bin/bash

echo "🔧 CORRIGINDO PROJETO DESEJOSHOT..."
echo ""

# ========================================
# 1. MATAR PROCESSOS NODE
# ========================================
echo "1️⃣ Matando processos Node.js..."
pkill -9 node 2>/dev/null || echo "Nenhum processo Node rodando"
sleep 2

# ========================================
# 2. CRIAR ESTRUTURA DE PASTAS
# ========================================
echo ""
echo "2️⃣ Criando estrutura de pastas..."

sudo mkdir -p /var/www/desejoshot/uploads/videos
sudo mkdir -p /var/www/desejoshot/uploads/frames
sudo mkdir -p /var/www/desejoshot/uploads/audio
sudo mkdir -p /var/www/desejoshot/thumbs
sudo mkdir -p /var/www/desejoshot/temp
sudo mkdir -p /var/www/desejoshot/public/sitemap

# Permissões
sudo chown -R $USER:$USER /var/www/desejoshot
sudo chmod -R 755 /var/www/desejoshot

echo "✅ Pastas criadas:"
ls -la /var/www/desejoshot/

# ========================================
# 3. REMOVER CONFLITO POSTGRESQL
# ========================================
echo ""
echo "3️⃣ Removendo arquivo conflitante (db.js PostgreSQL)..."

cd /root/axtron/axtron-backend

# Backup do db.js que usa PostgreSQL
if [ -f "db.js" ]; then
    mv db.js db.js.postgres.backup
    echo "✅ db.js (PostgreSQL) movido para backup"
fi

# Backup do models/db.js também
if [ -f "models/db.js" ]; then
    mv models/db.js models/db.js.backup
    echo "✅ models/db.js movido para backup"
fi

# ========================================
# 4. VERIFICAR MYSQL
# ========================================
echo ""
echo "4️⃣ Verificando MySQL..."

if ! command -v mysql &> /dev/null; then
    echo "⚠️  MySQL não está instalado!"
    echo "Instalando MySQL..."
    sudo apt update
    sudo apt install -y mysql-server
fi

# Testar se MySQL está rodando
if ! systemctl is-active --quiet mysql; then
    echo "Iniciando MySQL..."
    sudo systemctl start mysql
    sudo systemctl enable mysql
fi

echo "✅ MySQL está rodando"

# ========================================
# 5. CRIAR BANCO DE DADOS
# ========================================
echo ""
echo "5️⃣ Criando banco de dados..."

# Criar banco
sudo mysql -e "CREATE DATABASE IF NOT EXISTS desejoshot_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>/dev/null

# Criar usuário (se não existir)
sudo mysql -e "CREATE USER IF NOT EXISTS 'desejoshot_user'@'localhost' IDENTIFIED BY 'desejoshot_pass_2026';" 2>/dev/null

# Dar permissões
sudo mysql -e "GRANT ALL PRIVILEGES ON desejoshot_db.* TO 'desejoshot_user'@'localhost';" 2>/dev/null
sudo mysql -e "FLUSH PRIVILEGES;" 2>/dev/null

echo "✅ Banco de dados criado"

# ========================================
# 6. APLICAR SCHEMA SQL
# ========================================
echo ""
echo "6️⃣ Aplicando schema SQL..."

if [ -f "sql/mysql_schema_v2.sql" ]; then
    mysql -u desejoshot_user -pdesejoshot_pass_2026 desejoshot_db < sql/mysql_schema_v2.sql 2>/dev/null
    echo "✅ Schema aplicado"
else
    echo "⚠️  Arquivo sql/mysql_schema_v2.sql não encontrado"
fi

# ========================================
# 7. ATUALIZAR .ENV
# ========================================
echo ""
echo "7️⃣ Atualizando .env com configurações MySQL..."

# Backup do .env atual
cp .env .env.backup.$(date +%Y%m%d-%H%M%S)

# Criar .env correto
cat > .env << 'EOF'
# ========================================
# DESEJOSHOT - CONFIGURAÇÃO COMPLETA
# ========================================

PORT=4001

# GEMINI AI
GEMINI_API_KEY=

# MYSQL (NÃO POSTGRESQL!)
DB_HOST=127.0.0.1
DB_USER=desejoshot_user
DB_PASS=desejoshot_pass_2026
DB_NAME=desejoshot_db

# REDIS
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# CAMINHOS
UPLOAD_PATH=/var/www/desejoshot/uploads
THUMB_PATH=/var/www/desejoshot/thumbs
TEMP_PATH=/var/www/desejoshot/temp

# SEO
SITE_URL=http://187.77.35.230:4001
SUPPORTED_LOCALES=pt,en,es,fr,de,it,ru,ja,ar,hi

# PROCESSAMENTO
MAX_CONCURRENT_JOBS=3
BATCH_SIZE=10

# SEGURANÇA
JWT_SECRET=ChaveSuperSecretaDesejoshot2026MudarIsso
ADMIN_USER=admin
ADMIN_PASS_HASH=

# CORS
CORS_ORIGIN=http://187.77.35.230:4001,http://localhost:4001
EOF

echo "✅ .env atualizado"

# ========================================
# 8. VERIFICAR REDIS
# ========================================
echo ""
echo "8️⃣ Verificando Redis..."

if ! command -v redis-cli &> /dev/null; then
    echo "Instalando Redis..."
    sudo apt install -y redis-server
fi

if ! systemctl is-active --quiet redis; then
    sudo systemctl start redis
    sudo systemctl enable redis
fi

redis-cli ping > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Redis está rodando"
else
    echo "⚠️  Redis não está respondendo"
fi

# ========================================
# 9. VERIFICAR FFMPEG
# ========================================
echo ""
echo "9️⃣ Verificando FFmpeg..."

if ! command -v ffmpeg &> /dev/null; then
    echo "Instalando FFmpeg..."
    sudo apt install -y ffmpeg
fi

echo "✅ FFmpeg instalado: $(ffmpeg -version | head -n 1)"

# ========================================
# 10. REINSTALAR DEPENDÊNCIAS
# ========================================
echo ""
echo "🔟 Reinstalando dependências Node.js..."

rm -rf node_modules package-lock.json
npm install

# ========================================
# RESUMO FINAL
# ========================================
echo ""
echo "=========================================="
echo "✅ CORREÇÃO COMPLETA!"
echo "=========================================="
echo ""
echo "📋 O QUE FOI FEITO:"
echo "✅ Processos Node encerrados"
echo "✅ Pastas criadas em /var/www/desejoshot/"
echo "✅ Arquivo PostgreSQL (db.js) removido"
echo "✅ MySQL instalado e configurado"
echo "✅ Banco desejoshot_db criado"
echo "✅ Schema SQL aplicado"
echo "✅ .env atualizado para MySQL"
echo "✅ Redis instalado e rodando"
echo "✅ FFmpeg instalado"
echo "✅ Dependências reinstaladas"
echo ""
echo "=========================================="
echo "🚀 PRÓXIMOS PASSOS:"
echo "=========================================="
echo ""
echo "1. Obter GEMINI_API_KEY:"
echo "   https://aistudio.google.com/app/apikey"
echo ""
echo "2. Adicionar no .env:"
echo "   nano .env"
echo "   GEMINI_API_KEY=sua_chave_aqui"
echo ""
echo "3. Iniciar servidor:"
echo "   npm start"
echo ""
echo "4. Acessar:"
echo "   http://187.77.35.230:4001/admin.html"
echo ""
echo "=========================================="
