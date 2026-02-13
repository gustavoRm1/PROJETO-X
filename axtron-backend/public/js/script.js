/* AXTRON ENGINE V6 - AUTHENTICATION COMPLETE */

const App = {
    state: {
        token: localStorage.getItem('axtron_token'),
        user: JSON.parse(localStorage.getItem('axtron_user')),
        videos: []
    },

    init: function() {
        this.loadVideos();
        this.setupListeners();
        this.checkLoginState();
    },

    setupListeners: function() {
        const searchInput = document.getElementById('search-input');
        if(searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.realizarBusca();
            });
        }
    },

    checkLoginState: function() {
        const loginBtn = document.getElementById('header-login-btn'); 
        if(this.state.token && loginBtn) {
            const username = this.state.user ? this.state.user.username : 'Perfil';
            loginBtn.innerHTML = `<i class="fa-solid fa-user"></i> ${username}`;
            loginBtn.onclick = () => window.location.href = 'profile.html';
            loginBtn.classList.add('logged-in');
        } else if (loginBtn) {
            loginBtn.innerHTML = 'ENTRAR';
            loginBtn.onclick = () => this.ui.abrirModalAuth('login');
        }
    },

    loadVideos: async function(termo = '') {
        const container = document.getElementById('tube-feed');
        if(!container) return;
        container.innerHTML = '<div style="text-align:center; padding:40px; color:#666;"><i class="fa-solid fa-circle-notch fa-spin"></i> Carregando...</div>';

        try {
            const url = termo ? `/posts?search=${encodeURIComponent(termo)}` : '/posts';
            const response = await fetch(url);
            const videos = await response.json();
            this.renderGrid(videos);
        } catch (error) {
            console.error(error);
            container.innerHTML = '<p style="text-align:center; padding:20px;">Erro ao carregar vídeos.</p>';
        }
    },

    renderGrid: function(videos) {
        const container = document.getElementById('tube-feed');
        container.innerHTML = ''; 

        if (!videos || videos.length === 0) {
            container.innerHTML = '<p style="text-align:center; padding:20px;">Nenhum vídeo encontrado.</p>';
            return;
        }

        videos.forEach(vid => {
            const thumb = vid.thumbnail_url || 'https://via.placeholder.com/400x225/111/333?text=Video';
            const html = `
                <article class="video-card" onclick="window.location.href='video.html?id=${vid.id}'">
                    <div class="thumb-container">
                        <img src="${thumb}" class="poster-img" loading="lazy">
                        <span class="duration">${vid.duration || 'HD'}</span>
                    </div>
                    <div class="video-meta">
                        <h3 class="video-title">${vid.title}</h3>
                        <div class="stats">
                            <span>${vid.views || 0} views</span>
                        </div>
                    </div>
                </article>
            `;
            container.innerHTML += html;
        });
    },

    realizarBusca: function() {
        const input = document.getElementById('search-input');
        if(input) this.loadVideos(input.value);
    },

    ui: {
        abrirModalAuth: function(tab) {
            const modal = document.getElementById('auth-modal');
            if(modal) {
                modal.style.display = 'flex';
                this.switchAuthTab(tab);
            }
        },
        fecharModal: function() {
            document.getElementById('auth-modal').style.display = 'none';
        },
        switchAuthTab: function(tabName) {
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active-form'));

            if (tabName === 'login') {
                document.querySelector('.tab-btn:nth-child(1)').classList.add('active');
                document.getElementById('form-login').classList.add('active-form');
            } else {
                document.querySelector('.tab-btn:nth-child(2)').classList.add('active');
                document.getElementById('form-register').classList.add('active-form');
            }
        }
    },

    // --- AUTENTICAÇÃO (LOGIN E REGISTRO) ---
    auth: {
        // Função de Login
        login: async function(e) {
            e.preventDefault();
            this._submitAuth('/auth/login', {
                email: document.getElementById('login-email').value,
                password: document.getElementById('login-pass').value
            }, e.target);
        },

        // Função de Registro (CRIAR CONTA)
        register: async function(e) {
            e.preventDefault();
            this._submitAuth('/auth/register', {
                email: document.getElementById('reg-email').value,
                username: document.getElementById('reg-user').value,
                password: document.getElementById('reg-pass').value
            }, e.target);
        },

        // Função Genérica de Envio
        _submitAuth: async function(url, data, form) {
            const btn = form.querySelector('button');
            const originalText = btn.innerText;
            btn.innerText = "Processando...";
            btn.disabled = true;

            try {
                const res = await fetch(url, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(data)
                });
                const result = await res.json();

                if(res.ok) {
                    localStorage.setItem('axtron_token', result.token);
                    localStorage.setItem('axtron_user', JSON.stringify(result.user));
                    window.location.reload();
                } else {
                    alert(result.error || 'Erro na solicitação');
                }
            } catch(err) {
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

// Expondo funções para o HTML
window.abrirModalAuth = (t) => App.ui.abrirModalAuth(t);
window.fecharModal = () => App.ui.fecharModal();
window.switchAuthTab = (t) => App.ui.switchAuthTab(t);
window.loginUsuario = (e) => App.auth.login(e);
window.registrarUsuario = (e) => App.auth.register(e);
window.realizarBusca = () => App.realizarBusca();
