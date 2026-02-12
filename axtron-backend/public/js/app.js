const app = {
    // ESTADO
    state: {
        isLogged: localStorage.getItem('axtron_user') !== null,
        user: JSON.parse(localStorage.getItem('axtron_user')) || null
    },

    // DADOS MOCKADOS
    db: {
        videos: [
            { id: 1, title: "Novinha no Espelho", thumb: "https://placehold.co/600x400/111/333?text=Video+1", url: "", views: "1.2M", pro: false },
            { id: 2, title: "Cena Exclusiva", thumb: "https://placehold.co/600x400/222/444?text=Video+2", url: "", views: "850k", pro: true },
            { id: 3, title: "Bastidores VIP", thumb: "https://placehold.co/600x400/000/222?text=Video+3", url: "", views: "2.1M", pro: true },
            { id: 4, title: "Viral Tiktok", thumb: "https://placehold.co/600x400/151515/333?text=Video+4", url: "", views: "500k", pro: false },
        ],
        stories: [
            { name: "Ao Vivo", img: "https://placehold.co/100x100/ff0055/fff?text=LIVE", live: true },
            { name: "Key Alves", img: "https://placehold.co/100x100/111/333", live: false },
            { name: "Pipokinha", img: "https://placehold.co/100x100/222/444", live: false },
        ],
        hero: [
            { id: 99, title: "O VAZAMENTO DO ANO 🚨", tag: "EXCLUSIVO", img: "https://placehold.co/800x400/1a1a1a/ff0055?text=DESTAQUE+1" },
            { id: 98, title: "Lançamentos da Semana", tag: "NOVO", img: "https://placehold.co/800x400/111/7000ff?text=DESTAQUE+2" },
        ]
    },

    // INICIALIZAÇÃO
    init: function() {
        this.ui.updateInterface(); // Monta Sidebar e Header baseado no Login
        
        if (document.getElementById('feed-container')) this.renderHome();
        
        // Bloqueia acesso direto ao profile.html
        if (window.location.pathname.includes('profile.html') && !this.state.isLogged) {
            window.location.href = 'index.html';
        }
        
        console.log("AXTRON Engine V8.0 Loaded 🔒");
    },

    // AUTH GATEKEEPER
    auth: {
        login: function() {
            app.state.isLogged = true;
            app.state.user = { name: "Usuario Vip", avatar: "https://placehold.co/100x100/ff0055/fff?text=EU" };
            localStorage.setItem('axtron_user', JSON.stringify(app.state.user));
            app.ui.closeLoginModal();
            app.ui.updateInterface();
            alert("Login realizado! Modo Criador Ativado. 🚀");
        },
        logout: function() {
            localStorage.removeItem('axtron_user');
            app.state.isLogged = false;
            app.state.user = null;
            app.ui.updateInterface();
            window.location.href = 'index.html';
        },
        guard: function(callback) {
            if (app.state.isLogged) {
                if(callback) callback();
            } else {
                app.ui.openLoginModal("Entre para acessar essa função.");
            }
        }
    },

    // UI DINÂMICA (A MÁGICA)
    ui: {
        updateInterface: function() {
            const sidebar = document.getElementById('sidebarMenu');
            const mobile = document.getElementById('mobileMenu');
            const header = document.getElementById('headerAuth');
            const logoutArea = document.getElementById('logoutArea');

            // 1. HEADER AUTH
            if (header) {
                if (app.state.isLogged) {
                    header.innerHTML = `
                        <button class="btn-icon" onclick="window.location.href='profile.html'"><i class="ph ph-video-camera"></i></button>
                        <img src="${app.state.user.avatar}" class="header-avatar" onclick="window.location.href='profile.html'">
                    `;
                } else {
                    header.innerHTML = `
                        <button class="btn-signup" onclick="app.ui.openLoginModal()"><i class="ph ph-user-plus"></i> CRIAR CONTA</button>
                        <button class="btn-login" onclick="app.ui.openLoginModal()">ENTRAR</button>
                    `;
                }
            }

            // 2. SIDEBAR DINÂMICA
            if (sidebar) {
                if (app.state.isLogged) {
                    // MODO CRIADOR (Poder)
                    sidebar.innerHTML = `
                        <a href="index.html" class="nav-btn active"><i class="ph ph-house-fill"></i> Home</a>
                        <a href="#" class="nav-btn"><i class="ph ph-compass"></i> Explore</a>
                        <a href="#" class="nav-btn btn-leaks"><i class="ph ph-lock-key-open-fill"></i> VAZADOS</a>
                        <div style="border-top:1px solid #333; margin:15px 0; padding-top:15px;">
                            <span style="font-size:0.7rem; color:#666; padding-left:12px; text-transform:uppercase; font-weight:bold;">Studio</span>
                            <a href="profile.html" class="nav-btn"><i class="ph ph-user-circle"></i> Meu Perfil</a>
                            <a href="#" class="nav-btn"><i class="ph ph-chart-line-up"></i> Analytics</a>
                            <a href="#" class="nav-btn"><i class="ph ph-currency-dollar"></i> Faturamento</a>
                        </div>
                    `;
                    if(logoutArea) logoutArea.innerHTML = `<button class="nav-btn" onclick="app.auth.logout()" style="color:#ff4444;"><i class="ph ph-sign-out"></i> Sair</button>`;
                } else {
                    // MODO VISITANTE (Dopamina)
                    sidebar.innerHTML = `
                        <a href="index.html" class="nav-btn active"><i class="ph ph-house-fill"></i> Home</a>
                        <a href="#" class="nav-btn"><i class="ph ph-fire"></i> Em Alta</a>
                        <a href="#" class="nav-btn btn-live"><i class="ph ph-broadcast"></i> Ao Vivo <div class="live-dot"></div></a>
                        <a href="#" class="nav-btn btn-leaks"><i class="ph ph-lock-key-open-fill"></i> VAZADOS</a>
                        <a href="#" class="nav-btn" onclick="app.auth.guard()"><i class="ph ph-star"></i> Favoritos</a>
                    `;
                    if(logoutArea) logoutArea.innerHTML = '';
                }
            }

            // 3. MOBILE NAV
            if (mobile) {
                if (app.state.isLogged) {
                    mobile.innerHTML = `
                        <a href="index.html" class="b-nav-item active"><i class="ph ph-house-fill"></i></a>
                        <a href="#" class="b-nav-item"><i class="ph ph-compass"></i></a>
                        <a href="profile.html" class="b-nav-item highlight"><i class="ph ph-plus-circle-fill"></i></a>
                        <a href="#" class="b-nav-item"><i class="ph ph-chart-bar"></i></a>
                        <a href="profile.html" class="b-nav-item"><i class="ph ph-user"></i></a>
                    `;
                } else {
                    mobile.innerHTML = `
                        <a href="index.html" class="b-nav-item active"><i class="ph ph-house-fill"></i></a>
                        <a href="#" class="b-nav-item"><i class="ph ph-fire"></i></a>
                        <a href="#" class="b-nav-item highlight"><i class="ph ph-lock-key-open-fill"></i></a>
                        <a href="#" class="b-nav-item"><i class="ph ph-broadcast"></i></a>
                        <a href="#" class="b-nav-item" onclick="app.ui.openLoginModal()"><i class="ph ph-user"></i></a>
                    `;
                }
            }
        },

        openLoginModal: function(msg) {
            const modal = document.getElementById('loginModal');
            if(msg && document.getElementById('loginMsg')) document.getElementById('loginMsg').innerText = msg;
            modal.classList.add('open');
        },
        closeLoginModal: function() {
            document.getElementById('loginModal').classList.remove('open');
        }
    },

    // RENDERIZADORES DA HOME
    renderHome: function() {
        const storiesEl = document.getElementById('storiesContainer');
        storiesEl.innerHTML = this.db.stories.map(s => `
            <div class="story-item" onclick="app.auth.guard(() => alert('Story...'))">
                <div class="story-ring ${s.live ? 'live' : ''}"><img src="${s.img}" class="story-img"></div>
                <span class="story-name">${s.name}</span>
            </div>
        `).join('');

        const heroEl = document.getElementById('heroContainer');
        heroEl.innerHTML = this.db.hero.map(h => `
            <div class="hero-card" onclick="app.goToVideo(${h.id})">
                <img src="${h.img}" class="hero-img">
                <div class="hero-content"><span class="hero-tag">${h.tag}</span><h2 class="hero-title">${h.title}</h2></div>
            </div>
        `).join('');

        const feedEl = document.getElementById('feed-container');
        const rawVideos = [...this.db.videos, ...this.db.videos];
        feedEl.innerHTML = rawVideos.map(v => `
            <article class="card" onclick="app.goToVideo(${v.id})">
                <div class="card-media-wrapper">
                    ${v.pro ? '<span class="badge" style="background:var(--primary)">VIP</span>' : '<span class="badge">HD</span>'}
                    <img src="${v.thumb}" class="card-thumb">
                    <div class="card-overlay">
                        <h4 style="color:white; font-size:0.9rem;">${v.title}</h4>
                        <div style="display:flex; justify-content:space-between; margin-top:5px;">
                            <span style="color:#ccc; font-size:0.8rem;">${v.views}</span>
                            <button class="btn-feed-action" onclick="event.stopPropagation(); app.auth.guard()"><i class="ph ph-heart"></i></button>
                        </div>
                    </div>
                </div>
            </article>
        `).join('');
    },

    goToVideo: function(id) { window.location.href = `video.html?id=${id}`; }
};

document.addEventListener('DOMContentLoaded', () => app.init());