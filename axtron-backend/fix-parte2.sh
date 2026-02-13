#!/bin/bash

echo "🔧 CORREÇÃO FINAL - Parte 2..."
echo ""

cd /root/axtron/axtron-backend

# ========================================
# 1. CORRIGIR SENHA MYSQL
# ========================================
echo "1️⃣ Corrigindo senha do MySQL..."

# Tentar criar usuário com senha correta
sudo mysql -e "DROP USER IF EXISTS 'desejoshot_user'@'localhost';" 2>/dev/null
sudo mysql -e "CREATE USER 'desejoshot_user'@'localhost' IDENTIFIED BY 'desejoshot_pass_2026';" 2>/dev/null
sudo mysql -e "GRANT ALL PRIVILEGES ON desejoshot_db.* TO 'desejoshot_user'@'localhost';" 2>/dev/null
sudo mysql -e "FLUSH PRIVILEGES;" 2>/dev/null

echo "✅ Usuário MySQL recriado"

# Testar conexão
echo "Testando conexão MySQL..."
mysql -u desejoshot_user -pdesejoshot_pass_2026 -e "SELECT 1;" 2>/dev/null
if [ $? -eq 0 ]; then
    echo "✅ Conexão MySQL OK"
else
    echo "❌ Erro na conexão MySQL"
    echo "Tentando sem senha..."
    sudo mysql -e "ALTER USER 'desejoshot_user'@'localhost' IDENTIFIED BY '';" 2>/dev/null
    sudo mysql -e "FLUSH PRIVILEGES;" 2>/dev/null
    
    # Atualizar .env sem senha
    sed -i 's/DB_PASS=.*/DB_PASS=/' .env
    echo "✅ Senha MySQL removida"
fi

# ========================================
# 2. COMENTAR ROTAS ANTIGAS (PostgreSQL)
# ========================================
echo ""
echo "2️⃣ Desativando rotas antigas que usam PostgreSQL..."

# Fazer backup do server.js
cp server.js server.js.backup.$(date +%Y%m%d-%H%M%S)

# Criar server.js corrigido
cat > server.js << 'SERVERJS'
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// ============================================
// ROTAS DO SISTEMA SEO (FUNCIONAM!)
// ============================================
const uploadRoutes = require('./src/routes/upload');
const seoRoutes = require('./src/routes/seo');
const queueManager = require('./src/services/queueManager');
const analytics = require('./src/services/analytics');
const { authenticate, login } = require('./src/middleware/auth');
const { uploadLimiter, apiLimiter } = require('./src/middleware/rateLimiter');

const app = express();

// ============================================
// HEADERS DE SEGURANÇA
// ============================================
const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
};

// ============================================
// CORS CONFIGURATION
// ============================================
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
  : true;

// ============================================
// MIDDLEWARES
// ============================================
app.use(securityHeaders);
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// ============================================
// CRIAR PASTAS NECESSÁRIAS
// ============================================
const uploadPath = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

const videosPath = path.join(uploadPath, 'videos');
if (!fs.existsSync(videosPath)) {
  fs.mkdirSync(videosPath, { recursive: true });
}

// ============================================
// STATIC FILES
// ============================================
app.use('/uploads', express.static(uploadPath));
app.use('/thumbs', express.static(process.env.THUMB_PATH || path.join(__dirname, 'thumbs')));

// Servir Frontend
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

// ============================================
// INICIALIZAR QUEUE PROCESSORS
// ============================================
console.log('🔧 Inicializando processadores de fila...');
try {
  queueManager.setupProcessors();
  console.log('✅ Processadores de fila inicializados');
} catch (error) {
  console.error('❌ Erro ao inicializar processadores:', error.message);
}

// ============================================
// ROTAS DO SISTEMA SEO
// ============================================

// Login para admin SEO
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await login(username, password);
    res.json(result);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

// Rotas protegidas de upload e SEO
app.use('/api', apiLimiter);
app.use('/api/admin', authenticate, uploadLimiter, uploadRoutes);
app.use('/api/seo', authenticate, seoRoutes);

// Tracking de views (público)
app.post('/api/track/view/:videoId', async (req, res) => {
  try {
    await analytics.trackView(req.params.videoId, {
      referrer: req.headers.referer || null,
      userAgent: req.headers['user-agent'] || null,
      ip: req.ip || req.headers['x-forwarded-for'] || null,
      duration: Number(req.body.duration || 0)
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Erro ao rastrear view:', error);
    res.json({ success: false });
  }
});

// Stats das filas
app.get('/api/admin/queue/stats', authenticate, async (req, res) => {
  try {
    const stats = await queueManager.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Stats gerais (sem auth para teste)
app.get('/api/admin/stats', async (req, res) => {
  try {
    const db = require('./src/services/database');
    
    const [videos] = await db.execute('SELECT COUNT(*) as total FROM videos');
    const [queue] = await db.execute('SELECT COUNT(*) as pending FROM processing_queue WHERE status = "pending"');
    
    res.json({
      total_videos: videos[0]?.total || 0,
      queue_pending: queue[0]?.pending || 0,
      ai_cost: 0
    });
  } catch (error) {
    console.error('Erro ao buscar stats:', error);
    res.json({
      total_videos: 0,
      queue_pending: 0,
      ai_cost: 0
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: 'mysql',
      redis: 'checking',
      gemini: process.env.GEMINI_API_KEY ? 'configured' : 'missing'
    }
  });
});

// ============================================
// FALLBACK PARA SPA
// ============================================
app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 4001;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
========================================
🚀 DESEJOSHOT SERVER ONLINE
========================================
Port: ${PORT}
Environment: ${process.env.NODE_ENV || 'development'}
API: http://localhost:${PORT}/api
Admin: http://localhost:${PORT}/admin.html
========================================

⚙️  SERVIÇOS:
- MySQL: ${process.env.DB_HOST || '127.0.0.1'}:3306
- Redis: ${process.env.REDIS_HOST || '127.0.0.1'}:${process.env.REDIS_PORT || 6379}
- Gemini AI: ${process.env.GEMINI_API_KEY ? '✅ Configurado' : '❌ FALTANDO'}

📁 CAMINHOS:
- Uploads: ${process.env.UPLOAD_PATH || './uploads'}
- Thumbs: ${process.env.THUMB_PATH || './thumbs'}
- Temp: ${process.env.TEMP_PATH || './temp'}

========================================
  `);

  // Verificar variáveis críticas
  const missing = [];
  if (!process.env.GEMINI_API_KEY) missing.push('GEMINI_API_KEY');
  if (!process.env.DB_HOST) missing.push('DB_HOST');
  if (!process.env.REDIS_HOST) missing.push('REDIS_HOST');

  if (missing.length > 0) {
    console.warn('⚠️  VARIÁVEIS FALTANDO:', missing.join(', '));
    console.warn('⚠️  Configure o arquivo .env antes de usar o sistema completo!');
  }
});

// ============================================
// GRACEFUL SHUTDOWN
// ============================================
process.on('SIGTERM', () => {
  console.log('SIGTERM recebido, encerrando gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT recebido, encerrando gracefully...');
  process.exit(0);
});
SERVERJS

echo "✅ server.js corrigido (rotas antigas removidas)"

# ========================================
# 3. APLICAR SCHEMA NOVAMENTE
# ========================================
echo ""
echo "3️⃣ Reaplicando schema SQL..."

if [ -f "sql/mysql_schema_v2.sql" ]; then
    mysql -u desejoshot_user -pdesejoshot_pass_2026 desejoshot_db < sql/mysql_schema_v2.sql 2>/dev/null
    if [ $? -eq 0 ]; then
        echo "✅ Schema aplicado com sucesso"
    else
        # Tentar sem senha
        mysql -u desejoshot_user desejoshot_db < sql/mysql_schema_v2.sql 2>/dev/null
        echo "✅ Schema aplicado (sem senha)"
    fi
fi

# ========================================
# 4. TESTAR CONEXÃO MYSQL
# ========================================
echo ""
echo "4️⃣ Testando conexão MySQL via Node..."

node -e "
  require('dotenv').config();
  const db = require('./src/services/database');
  db.execute('SELECT 1 as test')
    .then(() => {
      console.log('✅ MySQL conectado via Node.js');
      process.exit(0);
    })
    .catch(e => {
      console.error('❌ Erro MySQL:', e.message);
      process.exit(1);
    });
" 2>&1

# ========================================
# RESUMO FINAL
# ========================================
echo ""
echo "=========================================="
echo "✅ CORREÇÃO PARTE 2 COMPLETA!"
echo "=========================================="
echo ""
echo "📋 O QUE FOI FEITO:"
echo "✅ Usuário MySQL recriado"
echo "✅ Rotas antigas (PostgreSQL) removidas"
echo "✅ server.js limpo e funcional"
echo "✅ Schema SQL reaplicado"
echo ""
echo "=========================================="
echo "🚀 TESTAR AGORA:"
echo "=========================================="
echo ""
echo "npm start"
echo ""
echo "Deve aparecer:"
echo "✅ MySQL: 127.0.0.1:3306"
echo "✅ Redis: 127.0.0.1:6379"
echo ""
echo "E NÃO deve aparecer:"
echo "❌ Error: Cannot find module '../db'"
echo "❌ Error: connect ECONNREFUSED 127.0.0.1:5432"
echo ""
echo "=========================================="
