const app = {
    state: {
        isLogged: localStorage.getItem('axtron_token') !== null,
        user: JSON.parse(localStorage.getItem('axtron_user')) || null
    },

    init: function() {
        this.ui.updateInterface();
        if (document.getElementById('feed-container')) this.renderHome();
        if (window.location.pathname.includes('profile.html') && !this.state.isLogged) {
            window.location.href = 'index.html';
        }
    },

    // RENDERIZAÇÃO REAL DO BANCO DE DADOS
    renderHome: async function() {
        const feedEl = document.getElementById('feed-container');
        if (!feedEl) return;

        try {
            const response = await fetch('/posts'); 
            const videos = await response.json();

            if (!videos || videos.length === 0) {
                feedEl.innerHTML = `<p style="color:#666; grid-column:1/-1; text-align:center; padding:40px;">Nenhum conteúdo disponível no momento.</p>`;
                return;
            }

            feedEl.innerHTML = videos.map(v => `
                <article class="card" onclick="app.goToVideo(${v.id})">
                    <div class="card-media-wrapper">
                        ${v.is_premium ? '<span class="badge" style="background:var(--primary)">VIP</span>' : '<span class="badge">HD</span>'}
                        <img src="${v.video_url && v.video_url.includes('http') ? v.video_url : '/uploads/' + v.video_url}" class="card-thumb" onerror="this.src='https://placehold.co/600x400/111/333?text=AXTRON'">
                        <div class="card-overlay">
                            <h4 style="color:white; font-size:0.9rem;">${v.title}</h4>
                            <div style="display:flex; justify-content:space-between; margin-top:5px;">
                                <span style="color:#ccc; font-size:0.8rem;">${v.views || 0} views</span>
                                <button class="btn-feed-action" onclick="event.stopPropagation(); app.auth.guard()"><i class="ph ph-heart"></i></button>
                            </div>
                        </div>
                    </div>
                </article>
            `).join('');
        } catch (error) {
            console.error("Erro ao carregar feed:", error);
            feedEl.innerHTML = `<p style="color:#ff4444; grid-column:1/-1; text-align:center;">Erro ao conectar com a API.</p>`;
        }
    },

    auth: {
        logout: function() {
            localStorage.clear();
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
                        <img src="${app.state.user?.avatar || 'https://placehold.co/100x100/ff0055/fff?text=EU'}" class="header-avatar" onclick="window.location.href='profile.html'">
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
            if(msg) document.getElementById('loginMsg').innerText = msg;
            modal.classList.add('open');
        },
        closeLoginModal: function() {
            document.getElementById('loginModal').classList.remove('open');
        }
    },

    goToVideo: function(id) { window.location.href = `video.html?id=${id}`; }
};

document.addEventListener('DOMContentLoaded', () => app.init());