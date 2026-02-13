# AXTRON — Senior Review + Debate de 5 Agentes

## Objetivo
Transformar o AXTRON em produto competitivo com padrão de mercado, priorizando:
- experiência de usuário consistente,
- API segura e escalável,
- performance web e crescimento de produto.

---

## Leitura geral do projeto (estado atual)
### Pontos fortes
- Estrutura simples e objetiva (Express + PostgreSQL + frontend estático).
- Fluxo básico de autenticação e upload funcional.
- CRUD inicial de posts/comentários já estruturado por rotas.

### Riscos principais
- Segurança: segredo JWT hardcoded em rota, upload sem validação de tipo/tamanho e endpoints críticos sem proteção.
- UX: padrões visuais e feedback de erro/carregamento pouco uniformes entre páginas.
- Escalabilidade: falta de camadas de serviço/validação e ausência de limitação de taxa em autenticação.
- Operação: falta de suite de testes mínima e padrões de qualidade em CI.

---

## Debate simulado entre 5 agentes especialistas

### Agente 1 — UX Lead (obrigatório)
**Visão:** “Se a UI não for previsível e consistente, o usuário abandona antes de virar métrica.”

**Diretrizes:**
1. Definir Design Tokens globais (cores, spacing, radius, tipografia e estados).
2. Padronizar componentes críticos: botões, inputs, cards de vídeo, modal de login, alertas.
3. Acessibilidade mínima: foco visível, contraste AA, labels corretas e navegação por teclado.
4. Estados de interface obrigatórios: loading, vazio, erro e sucesso em todas as páginas.

---

### Agente 2 — Security/API Specialist (obrigatório)
**Visão:** “Sem baseline de segurança, crescimento só aumenta risco.”

**Diretrizes:**
1. JWT secret exclusivamente por ambiente + expiração explícita.
2. Rate limiting para rotas de auth (proteção de brute force).
3. Headers de segurança (helmet) e CORS com origem controlável por env.
4. Validação de payload (email/senha/tamanho).
5. Proteger criação de posts com token antes de ir para produção.

---

### Agente 3 — Performance Engineer
**Visão:** “A diferença entre ‘bom’ e ‘grande mercado’ aparece no tempo de resposta.”

**Diretrizes:**
1. Paginação em listagem de posts.
2. Compressão e cache para assets estáticos.
3. Índices no banco para busca por título/data/autor.
4. Estratégia de thumbnails otimizadas para feed.

---

### Agente 4 — Product/Growth Strategist
**Visão:** “Sem instrumentação e hipótese de produto, não há evolução orientada por dados.”

**Diretrizes:**
1. Definir North Star Metric (ex.: minutos assistidos por usuário ativo).
2. Eventos de funil: login, upload, play, comentário, retorno D+1/D+7.
3. Roadmap quinzenal com entregas de impacto vs esforço.

---

### Agente 5 — QA/Platform Engineer
**Visão:** “Qualidade consistente é vantagem competitiva invisível.”

**Diretrizes:**
1. Testes mínimos em auth/posts (happy path + falhas).
2. Lint/format padronizado.
3. Pipeline CI com checks automáticos antes de merge.
4. Checklist de release (security + smoke test).

---

## Decisão final do debate (consenso)
### Fase 1 — Fundamentos (1–2 semanas)
- Segurança baseline (JWT env, rate limit, headers).
- Padrão UX unificado para auth/feed/profile.
- Logging de erros e padronização de resposta da API.

### Fase 2 — Escala inicial (2–4 semanas)
- Paginação e busca otimizada.
- Proteção real de upload e autorização por usuário.
- Monitoramento básico (latência, erros 4xx/5xx, uso de rotas).

### Fase 3 — Diferenciação (4–8 semanas)
- Recomendação de conteúdo simples.
- Onboarding orientado por perfil.
- Testes A/B em cards e ranking.

---

## Padrão único para TODO o projeto (UX + API)
1. **Design System mínimo**: tokens + componentes reutilizáveis.
2. **Contratos de API**: respostas no formato `{ success, data, error }`.
3. **Segurança por padrão**: endpoint novo já nasce com validação/autorização.
4. **Observabilidade por padrão**: cada feature com evento e métrica definida.

Esse alinhamento garante velocidade sem perder consistência — requisito para competir com líderes do mercado.
