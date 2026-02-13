// js/app.js - Versão Integrada DB + UI
const app = {
    state: {
        isLogged: !!localStorage.getItem('axtron_token'),
        user: JSON.parse(localStorage.getItem('axtron_user')) || null
    },

    init: function() {
        this.ui.updateInterface();
        
        // Só carrega o feed se estivermos na Home
        if (document.getElementById('feed-container')) {
            this.renderHome();
        }
    },

    // --- CONEXÃO COM A API (FEED) ---
    renderHome: async function() {
        const feedEl = document.getElementById('feed-container');
        if (!feedEl) return;

        feedEl.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:50px; color:#666;">Carregando vídeos... <i class="ph ph-spinner ph-spin"></i></div>`;

        try {
            // Chama a rota GET /posts do seu server.js
            const response = await fetch('/posts');
            const videos = await response.json();

            if (!videos || videos.length === 0) {
                feedEl.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:50px;">
                    <h3>Nenhum vídeo ainda 😢</h3>
                    <p style="color:#888;">Seja o primeiro a postar!</p>
                </div>`;
                return;
            }

            // Renderiza cada vídeo do banco
            feedEl.innerHTML = videos.map(v => {
                // Ajusta URL da thumb (se não tiver, usa placeholder)
                const thumb = v.thumbnail_url || `https://placehold.co/600x400/111/333?text=${encodeURIComponent(v.title)}`;
                
                return `
                <article class="card" onclick="window.location.href='video.html?id=${v.id}'">
                    <div class="card-media-wrapper">
                        ${v.is_premium ? '<span class="badge" style="background:var(--primary)">VIP Somente</span>' : '<span class="badge">Grátis</span>'}
                        <img src="${thumb}" class="card-thumb" loading="lazy">
                        <div class="card-overlay">
                            <h4 style="color:white; font-size:0.9rem; text-shadow:1px 1px 3px black;">${v.title}</h4>
                            <div style="display:flex; justify-content:space-between; margin-top:5px; align-items:center;">
                                <span style="color:#ccc; font-size:0.8rem;"><i class="ph ph-eye"></i> ${v.views || 0}</span>
                                <span style="color:#ccc; font-size:0.8rem;">@${v.user_id}</span>
                            </div>
                        </div>
                    </div>
                </article>
            `}).join('');

        } catch (error) {
            console.error("Erro no feed:", error);
            feedEl.innerHTML = `<p style="color:#ff4444; text-align:center; grid-column:1/-1;">Erro ao carregar vídeos. Verifique a API.</p>`;
        }
    },

    // --- GERENCIAMENTO DE TELA (UI) ---
    ui: {
        updateInterface: function() {
            const sidebar = document.getElementById('sidebarMenu');
            const headerAuth = document.getElementById('headerAuth');
            const logoutArea = document.getElementById('logoutArea');

            // 1. HEADER (Topo)
            if (headerAuth) {
                if (app.state.isLogged) {
                    headerAuth.innerHTML = `
                        <button class="btn-icon" onclick="window.location.href='profile.html'"><i class="ph ph-upload-simple"></i></button>
                        <div style="display:flex; align-items:center; gap:10px; cursor:pointer;" onclick="window.location.href='profile.html'">
                            <span style="color:white; font-size:0.9rem;">${app.state.user.name.split(' ')[0]}</span>
                            <img src="${app.state.user.avatar || 'https://placehold.co/100x100/333/fff?text=U'}" class="header-avatar">
                        </div>
                    `;
                } else {
                    headerAuth.innerHTML = `
                        <button class="btn-signup" onclick="app.ui.openLoginModal()"><i class="ph ph-user-plus"></i></button>
                        <button class="btn-login" onclick="app.ui.openLoginModal()">ENTRAR</button>
                    `;
                }
            }

            // 2. SIDEBAR (Lateral)
            if (sidebar) {
                if (app.state.isLogged) {
                    sidebar.innerHTML = `
                        <a href="index.html" class="nav-btn active"><i class="ph ph-house-fill"></i> Início</a>
                        <a href="#" class="nav-btn"><i class="ph ph-compass"></i> Explorar</a>
                        <a href="#" class="nav-btn" style="color:var(--primary)"><i class="ph ph-crown-simple"></i> Assinaturas</a>
                        <div class="nav-divider"></div>
                        <a href="profile.html" class="nav-btn"><i class="ph ph-user-circle"></i> Meu Canal</a>
                        <a href="profile.html" class="nav-btn"><i class="ph ph-chart-bar"></i> Analytics</a>
                    `;
                    // Botão Sair no rodapé do menu
                    if(logoutArea) logoutArea.innerHTML = `<button onclick="Auth.logout()" class="nav-btn" style="color:#ff6b6b;"><i class="ph ph-sign-out"></i> Sair</button>`;
                } else {
                    sidebar.innerHTML = `
                        <a href="index.html" class="nav-btn active"><i class="ph ph-house-fill"></i> Início</a>
                        <a href="#" class="nav-btn"><i class="ph ph-fire"></i> Em Alta</a>
                        <a href="#" class="nav-btn" onclick="app.ui.openLoginModal()"><i class="ph ph-lock-key"></i> Login para ver mais</a>
                    `;
                    if(logoutArea) logoutArea.innerHTML = '';
                }
            }
        },

        openLoginModal: function() {
            document.getElementById('loginModal').classList.add('open');
        },
        closeLoginModal: function() {
            document.getElementById('loginModal').classList.remove('open');
        }
    }
};

document.addEventListener('DOMContentLoaded', () => app.init());