# DesejosHot — Plano de Máquina Autônoma de Tráfego Orgânico

## O que foi implementado nesta entrega

### 1) Base técnica para pipeline autônomo
- Schema MySQL v2 criado em `sql/mysql_schema_v2.sql` com blocos de vídeos, conteúdo SEO, traduções, fila e sitemap.
- Novo serviço modular `src/seo-engine.js` com healthcheck, auth admin, tracking e rotas de upload/SEO.
- Módulos implementados:
  - `src/services/database.js` (mysql2/promise)
  - `src/services/aiProcessor.js` (Gemini metadata/translation/schema)
  - `src/services/videoProcessor.js` (ffprobe + validação)
  - `src/services/queueManager.js` (Bull + Redis, processamento de metadados/artigos)
  - `src/services/sitemapGenerator.js` (sitemap xml + cache em DB + ping Google)
  - `src/services/analytics.js` (tracking de views e relatório)
  - `src/routes/upload.js` (upload admin + enfileiramento)
  - `src/routes/seo.js` (sitemap, artigos, keywords)
  - `src/middleware/auth.js` e `src/middleware/rateLimiter.js`

### 2) Operação e deploy
- `ecosystem.config.js` para PM2 cluster.
- `.env.seo.example` completo com variáveis de segurança/admin.

### 3) Correção de gargalo crítico de auth
- `routes/auth.js` usa hash por `crypto.scrypt` (sem dependência nativa binária), reduzindo falha de runtime em ambientes com `bcrypt` incompatível.

## Roadmap de execução (90 dias)

### Sprint 1 (Semanas 1-2)
- Subir `seo-engine` em VPS separada.
- Rodar migration `mysql_schema_v2.sql`.
- Integrar upload admin com processamento assíncrono (fila).
- Publicar sitemap incremental para vídeos prontos.

### Sprint 2 (Semanas 3-5)
- Expandir geração SEO por vídeo (title/meta/description/tags + JSON-LD).
- Implementar traduções em 10 idiomas.
- Criar gerador de páginas estáticas para categoria + vídeo + artigo.

### Sprint 3 (Semanas 6-8)
- Inserir clusterização de long-tail keywords por categoria.
- Gerar artigos automáticos por template.
- Internal linking automático entre vídeos/categorias/artigos.

### Sprint 4 (Semanas 9-12)
- Otimização de indexação (sitemap shards + ping + recrawl schedule).
- Cache agressivo (Redis + CDN).
- Painel de custo IA por lote e ROI por categoria.

## KPIs operacionais
- URLs publicadas/dia
- URLs indexadas (Search Console)
- CTR por tipo de página
- Custo IA por 1k páginas publicadas
- Receita por 1k sessões orgânicas
