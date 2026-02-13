/* AXTRON ENGINE V7 - REAL BACKEND FLOW */

const App = {
    state: {
        token: localStorage.getItem('axtron_token'),
        user: JSON.parse(localStorage.getItem('axtron_user') || 'null'),
        videos: [],
        mode: 'all',
        selectedCategory: 'Tudo'
    },

    init: function() {
        this.setupListeners();
        this.checkLoginState();
        this.bindCategoryFilters();
        this.loadVideos();
    },

    setupListeners: function() {
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.realizarBusca();
            });
        }

        const favoritesBtn = document.getElementById('nav-favorites');
        if (favoritesBtn) {
            favoritesBtn.addEventListener('click', () => this.loadFavorites());
        }

        const libraryBtn = document.getElementById('nav-library');
        if (libraryBtn) {
            libraryBtn.addEventListener('click', () => this.loadFavorites());
        }

        const homeBtn = document.getElementById('nav-home');
        if (homeBtn) {
            homeBtn.addEventListener('click', () => {
                this.state.mode = 'all';
                this.loadVideos();
            });
        }
    },

    bindCategoryFilters: function() {
        const pills = document.querySelectorAll('.cat-pill');
        pills.forEach((pill) => {
            pill.addEventListener('click', () => {
                pills.forEach((p) => p.classList.remove('active'));
                pill.classList.add('active');
                this.state.selectedCategory = pill.textContent.trim();
                this.state.mode = 'all';
                this.loadVideos();
            });
        });
    },

    getAuthHeaders: function() {
        return this.state.token ? { Authorization: `Bearer ${this.state.token}` } : {};
    },

    checkLoginState: function() {
        const avatarBtn = document.querySelector('.user-avatar');
        if (!avatarBtn) return;

        if (this.state.token && this.state.user) {
            avatarBtn.innerHTML = `<i class="fa-solid fa-user-check"></i>`;
            avatarBtn.onclick = () => window.location.href = 'profile.html';
        } else {
            avatarBtn.innerHTML = `<i class="fa-solid fa-user"></i>`;
            avatarBtn.onclick = () => this.ui.abrirModalAuth('login');
        }
    },

    loadVideos: async function(termo = '') {
        const container = document.getElementById('tube-feed');
        if (!container) return;

        container.innerHTML = '<div style="text-align:center; padding:40px; color:#666;"><i class="fa-solid fa-circle-notch fa-spin"></i> Carregando...</div>';

        try {
            const params = new URLSearchParams();
            if (termo) params.set('search', termo);
            if (this.state.selectedCategory && this.state.selectedCategory !== 'Tudo') {
                params.set('category', this.state.selectedCategory);
            }

            const query = params.toString();
            const response = await fetch(`/posts${query ? `?${query}` : ''}`, {
                headers: this.getAuthHeaders()
            });
            const videos = await response.json();
            this.state.videos = videos;
            this.renderGrid(videos);
        } catch (error) {
            console.error(error);
            container.innerHTML = '<p style="text-align:center; padding:20px;">Erro ao carregar vídeos.</p>';
        }
    },

    loadFavorites: async function() {
        if (!this.state.token) {
            this.ui.abrirModalAuth('login');
            return;
        }

        const container = document.getElementById('tube-feed');
        container.innerHTML = '<div style="text-align:center; padding:40px; color:#666;"><i class="fa-solid fa-circle-notch fa-spin"></i> Carregando favoritos...</div>';

        try {
            this.state.mode = 'favorites';
            const response = await fetch('/posts/library/favorites', {
                headers: this.getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Falha ao buscar favoritos');
            }

            const videos = await response.json();
            this.state.videos = videos;
            this.renderGrid(videos, true);
        } catch (error) {
            console.error(error);
            container.innerHTML = '<p style="text-align:center; padding:20px;">Erro ao carregar favoritos.</p>';
        }
    },

    toggleFavorite: async function(postId) {
        if (!this.state.token) {
            this.ui.abrirModalAuth('login');
            return;
        }

        const response = await fetch(`/posts/${postId}/favorite`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...this.getAuthHeaders()
            }
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            alert(data.error || 'Não foi possível favoritar.');
            return;
        }

        if (this.state.mode === 'favorites') {
            this.loadFavorites();
        } else {
            this.loadVideos(document.getElementById('search-input')?.value || '');
        }
    },

    renderGrid: function(videos, isLibrary = false) {
        const container = document.getElementById('tube-feed');
        container.innerHTML = '';

        if (!videos || videos.length === 0) {
            container.innerHTML = `<p style="text-align:center; padding:20px;">${isLibrary ? 'Sua library está vazia.' : 'Nenhum vídeo encontrado.'}</p>`;
            return;
        }

        videos.forEach((vid) => {
            const thumb = vid.thumbnail_url || 'https://via.placeholder.com/400x225/111/333?text=Video';
            const favLabel = vid.is_favorite ? 'Remover' : 'Favoritar';

            const html = `
                <article class="video-card">
                    <div class="thumb-container" onclick="window.location.href='video.html?id=${vid.id}'">
                        <img src="${thumb}" class="poster-img" loading="lazy">
                        <span class="duration">${vid.duration || 'HD'}</span>
                    </div>
                    <div class="video-meta">
                        <h3 class="video-title" onclick="window.location.href='video.html?id=${vid.id}'">${vid.title}</h3>
                        <div class="stats" style="display:flex; justify-content:space-between; gap:8px; align-items:center;">
                            <span>${vid.views || 0} views • ${vid.likes_count || 0} likes</span>
                            <button onclick="App.toggleFavorite(${vid.id})" style="background:#1f1f1f; color:#fff; border:1px solid #333; border-radius:8px; padding:5px 8px; cursor:pointer;">${favLabel}</button>
                        </div>
                    </div>
                </article>
            `;
            container.innerHTML += html;
        });
    },

    realizarBusca: function() {
        const input = document.getElementById('search-input');
        if (input) {
            this.state.mode = 'all';
            this.loadVideos(input.value);
        }
    },

    ui: {
        abrirModalAuth: function(tab) {
            const modal = document.getElementById('auth-modal');
            if (modal) {
                modal.style.display = 'flex';
                this.switchAuthTab(tab);
            }
        },
        fecharModal: function() {
            const modal = document.getElementById('auth-modal');
            if (modal) modal.style.display = 'none';
        },
        switchAuthTab: function(tabName) {
            document.querySelectorAll('.tab-btn').forEach((btn) => btn.classList.remove('active'));
            document.querySelectorAll('.auth-form').forEach((form) => form.classList.remove('active-form'));

            if (tabName === 'login') {
                document.querySelector('.tab-btn:nth-child(1)').classList.add('active');
                document.getElementById('form-login').classList.add('active-form');
            } else {
                document.querySelector('.tab-btn:nth-child(2)').classList.add('active');
                document.getElementById('form-register').classList.add('active-form');
            }
        }
    },

    auth: {
        login: async function(e) {
            e.preventDefault();
            this._submitAuth('/auth/login', {
                email: document.getElementById('login-email').value,
                password: document.getElementById('login-pass').value
            }, e.target);
        },

        register: async function(e) {
            e.preventDefault();
            this._submitAuth('/auth/register', {
                email: document.getElementById('reg-email').value,
                username: document.getElementById('reg-user').value,
                password: document.getElementById('reg-pass').value
            }, e.target);
        },

        _submitAuth: async function(url, data, form) {
            const btn = form.querySelector('button');
            const originalText = btn.innerText;
            btn.innerText = 'Processando...';
            btn.disabled = true;

            try {
                const res = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                const result = await res.json();

                if (res.ok) {
                    localStorage.setItem('axtron_token', result.token);
                    localStorage.setItem('axtron_user', JSON.stringify(result.user));
                    window.location.reload();
                } else {
                    alert(result.error || 'Erro na solicitação');
                }
            } catch (err) {
                console.error(err);
                alert('Erro de conexão com o servidor.');
            } finally {
                btn.innerText = originalText;
                btn.disabled = false;
            }
        }
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());

window.abrirModalAuth = (t) => App.ui.abrirModalAuth(t);
window.fecharModal = () => App.ui.fecharModal();
window.switchAuthTab = (t) => App.ui.switchAuthTab(t);
window.loginUsuario = (e) => App.auth.login(e);
window.registrarUsuario = (e) => App.auth.register(e);
window.realizarBusca = () => App.realizarBusca();
window.App = App;
