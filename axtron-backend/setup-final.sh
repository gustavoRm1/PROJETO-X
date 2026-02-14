#!/bin/bash

echo "🔧 CONFIGURAÇÃO FINAL - SISTEMA 100% FUNCIONAL"
echo ""

cd /root/axtron/axtron-backend

# ========================================
# 1. ATUALIZAR .ENV COM TUDO
# ========================================
echo "1️⃣ Atualizando .env com todas configurações..."

cat > .env << 'EOF'
# ========================================
# DESEJOSHOT - CONFIGURAÇÃO COMPLETA
# ========================================

PORT=4001

# GEMINI AI
GEMINI_API_KEY=AIzaSyDePinWpUgl0qRuLMtZ06HV6TI7QipbkHU

# MYSQL
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
ADMIN_PASS_HASH=PLACEHOLDER_HASH

# CORS
CORS_ORIGIN=http://187.77.35.230:4001,http://localhost:4001
EOF

echo "✅ .env criado"

# ========================================
# 2. GERAR HASH DA SENHA: 123sefudeu
# ========================================
echo ""
echo "2️⃣ Gerando hash da senha '123sefudeu'..."

HASH=$(node -e "
const bcrypt = require('bcrypt');
bcrypt.hash('123sefudeu', 10).then(hash => {
  console.log(hash);
}).catch(err => {
  console.error('Erro:', err);
});
" 2>&1 | tail -n 1)

if [ -z "$HASH" ]; then
    echo "❌ Erro ao gerar hash"
    exit 1
fi

echo "✅ Hash gerado: ${HASH:0:30}..."

# Substituir no .env
sed -i "s|ADMIN_PASS_HASH=PLACEHOLDER_HASH|ADMIN_PASS_HASH=$HASH|g" .env

echo "✅ Hash adicionado ao .env"

# ========================================
# 3. CORRIGIR MIDDLEWARE AUTH
# ========================================
echo ""
echo "3️⃣ Corrigindo middleware de autenticação..."

cat > src/middleware/auth.js << 'AUTHJS'
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret_key_in_production';

/**
 * Middleware de autenticação
 */
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
        return res.status(401).json({ error: 'Token não fornecido' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token não fornecido' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token inválido' });
    }
}

/**
 * Login
 */
async function login(username, password) {
    const ADMIN_USER = process.env.ADMIN_USER || 'admin';
    const ADMIN_PASS_HASH = process.env.ADMIN_PASS_HASH;

    console.log('🔐 Tentativa de login:', username);
    console.log('🔐 Usuário esperado:', ADMIN_USER);
    console.log('🔐 Hash configurado:', ADMIN_PASS_HASH ? 'SIM' : 'NÃO');

    if (username !== ADMIN_USER) {
        console.log('❌ Usuário incorreto');
        throw new Error('Credenciais inválidas');
    }

    if (!ADMIN_PASS_HASH) {
        console.log('❌ Hash não configurado no .env');
        throw new Error('Sistema não configurado');
    }

    try {
        const validPassword = await bcrypt.compare(password, ADMIN_PASS_HASH);
        
        console.log('🔐 Senha válida:', validPassword);

        if (!validPassword) {
            throw new Error('Credenciais inválidas');
        }

        const token = jwt.sign(
            { username, role: 'admin' },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log('✅ Login bem-sucedido');

        return { token, user: { username, role: 'admin' } };
        
    } catch (error) {
        console.error('❌ Erro no login:', error.message);
        throw new Error('Credenciais inválidas');
    }
}

module.exports = { authenticate, login };
AUTHJS

echo "✅ Middleware de auth corrigido"

# ========================================
# 4. ATUALIZAR ROTA DE STATUS DO UPLOAD
# ========================================
echo ""
echo "4️⃣ Adicionando rota de status do upload..."

# Verificar se já existe
if ! grep -q "/api/admin/upload/status" src/routes/upload.js; then
    cat >> src/routes/upload.js << 'STATUSROUTE'

/**
 * ROTA: Status do Processamento
 */
router.get('/admin/upload/status/:videoId', async (req, res) => {
  const { videoId } = req.params;

  try {
    // Buscar vídeo
    const video = await db.execute(
      'SELECT id, uuid, status, processed_at FROM videos WHERE id = ?',
      [videoId]
    );

    if (video.length === 0) {
      return res.status(404).json({ error: 'Vídeo não encontrado' });
    }

    // Buscar progresso das tarefas
    const tasks = await db.execute(
      `SELECT task_type, status, started_at, completed_at, error_message
       FROM processing_queue
       WHERE video_id = ?
       ORDER BY priority`,
      [videoId]
    );

    // Calcular progresso
    const totalTasks = tasks.length || 1;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const progress = Math.floor((completedTasks / totalTasks) * 100);

    res.json({
      videoId,
      uuid: video[0].uuid,
      status: video[0].status,
      progress,
      tasks: tasks.map(t => ({
        type: t.task_type,
        status: t.status,
        duration: t.completed_at && t.started_at
          ? Math.floor((new Date(t.completed_at) - new Date(t.started_at)) / 1000)
          : null,
        error: t.error_message
      }))
    });

  } catch (error) {
    console.error('Erro ao buscar status:', error);
    res.status(500).json({ error: 'Erro ao buscar status' });
  }
});
STATUSROUTE
    echo "✅ Rota de status adicionada"
else
    echo "✅ Rota de status já existe"
fi

# ========================================
# 5. VERIFICAR CONEXÃO MYSQL
# ========================================
echo ""
echo "5️⃣ Testando conexão MySQL..."

node -e "
  require('dotenv').config();
  const db = require('./src/services/database');
  db.execute('SELECT 1 as test')
    .then(() => {
      console.log('✅ MySQL OK');
      process.exit(0);
    })
    .catch(e => {
      console.error('❌ MySQL ERRO:', e.message);
      process.exit(1);
    });
" 2>&1

# ========================================
# 6. VERIFICAR REDIS
# ========================================
echo ""
echo "6️⃣ Verificando Redis..."

redis-cli ping > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Redis OK"
else
    echo "⚠️  Redis não está respondendo"
fi

# ========================================
# 7. REINICIAR PM2
# ========================================
echo ""
echo "7️⃣ Reiniciando servidor PM2..."

pm2 restart desejoshot
sleep 3

# Mostrar logs
echo ""
echo "📋 Logs do servidor:"
pm2 logs desejoshot --lines 10 --nostream

# ========================================
# 8. TESTAR LOGIN
# ========================================
echo ""
echo "8️⃣ Testando endpoint de login..."

RESPONSE=$(curl -s -X POST http://localhost:4001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123sefudeu"}')

echo "Resposta do servidor: $RESPONSE"

if echo "$RESPONSE" | grep -q "token"; then
    echo "✅ Login funcionando!"
else
    echo "⚠️  Login ainda não funcionou, verifique logs acima"
fi

# ========================================
# RESUMO FINAL
# ========================================
echo ""
echo "=========================================="
echo "✅ CONFIGURAÇÃO COMPLETA!"
echo "=========================================="
echo ""
echo "📋 CREDENCIAIS:"
echo "   Usuário: admin"
echo "   Senha: 123sefudeu"
echo ""
echo "🔑 GEMINI API KEY:"
echo "   AIzaSyDePinWpUgl0qRuLMtZ06HV6TI7QipbkHU"
echo ""
echo "🌐 ACESSAR:"
echo "   http://187.77.35.230:4001/login.html"
echo ""
echo "🧪 TESTAR LOGIN:"
echo "   curl -X POST http://187.77.35.230:4001/api/auth/login \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"username\":\"admin\",\"password\":\"123sefudeu\"}'"
echo ""
echo "=========================================="
echo ""
echo "📊 STATUS DOS SERVIÇOS:"
pm2 status
echo ""
echo "=========================================="
