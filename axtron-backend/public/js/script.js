/* AXTRON ENGINE V5 - FULL INTEGRATION */

const App = {
    state: {
        token: localStorage.getItem('axtron_token'),
        user: JSON.parse(localStorage.getItem('axtron_user')),
        videos: []
    },

    init: function() {
        console.log("AXTRON Engine Iniciado 🚀");
        this.loadVideos(); // Carrega feed inicial
        this.setupListeners();
        this.checkLoginState();
    },

    // --- CONFIGURAÇÃO DE EVENTOS ---
    setupListeners: function() {
        // Busca ao pressionar ENTER
        const searchInput = document.getElementById('search-input');
        if(searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.realizarBusca();
            });
        }

        // Botão de Busca (Lupa) - Caso você adicione um botão de clique
        const searchBtn = document.getElementById('search-btn');
        if(searchBtn) {
            searchBtn.addEventListener('click', () => this.realizarBusca());
        }
    },

    // --- VERIFICAÇÃO DE LOGIN ---
    checkLoginState: function() {
        const loginBtn = document.getElementById('header-login-btn'); 
        
        if(this.state.token && loginBtn) {
            // Usuário Logado: Mostra Perfil
            const username = this.state.user ? this.state.user.name.split(' ')[0] : 'Perfil';
            loginBtn.innerHTML = `<i class="fa-solid fa-user"></i> ${username}`;
            loginBtn.onclick = () => window.location.href = 'profile.html';
            loginBtn.classList.add('logged-in');
        } else if (loginBtn) {
            // Usuário Deslogado: Abre Modal
            loginBtn.innerHTML = 'ENTRAR';
            loginBtn.onclick = () => this.ui.abrirModalAuth('login');
        }
    },

    // --- CORE: CARREGAR VÍDEOS DA API ---
    loadVideos: async function(termo = '') {
        const container = document.getElementById('tube-feed');
        if(!container) return;

        container.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:40px; color:#666;"><i class="fa-solid fa-circle-notch fa-spin fa-2x"></i><br>Carregando...</div>';

        try {
            // Constrói a URL: se tiver termo, usa ?search=...
            const url = termo ? `/posts?search=${encodeURIComponent(termo)}` : '/posts';
            
            const response = await fetch(url);
            
            if(!response.ok) throw new Error('Falha na API');

            const videos = await response.json();
            this.renderGrid(videos);

        } catch (error) {
            console.error(error);
            container.innerHTML = `
                <div style="grid-column:1/-1; text-align:center; padding:40px;">
                    <i class="fa-solid fa-wifi" style="color:#ff4444; font-size:2rem; margin-bottom:10px;"></i>
                    <p>Erro de conexão com o servidor.</p>
                    <button onclick="App.loadVideos()" style="padding:5px 10px; cursor:pointer;">Tentar Novamente</button>
                </div>`;
        }
    },

    // --- RENDERIZAÇÃO DO GRID (HTML) ---
    renderGrid: function(videos) {
        const container = document.getElementById('tube-feed');
        container.innerHTML = ''; 

        if (!videos || videos.length === 0) {
            container.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:40px; color:#888;"><h3>Nenhum vídeo encontrado 😢</h3><p>Tente buscar por outro termo.</p></div>';
            return;
        }

        videos.forEach(vid => {
            // Lógica de tempo (ex: "há 2 dias")
            const timeAgo = this.helpers.timeSince(new Date(vid.created_at));
            
            // Thumbnail (Usa placeholder se não tiver)
            const thumb = vid.thumbnail_url || `https://via.placeholder.com/400x225/111/333?text=${encodeURIComponent(vid.title)}`;
            
            // Username (fallback se não tiver join)
            const author = vid.username ? `@${vid.username}` : '@admin';

            const html = `
                <article class="video-card" onclick="window.location.href='video.html?id=${vid.id}'">
                    <div class="thumb-container">
                        <img src="${thumb}" class="poster-img" alt="${vid.title}" loading="lazy">
                        <span class="duration">${vid.duration || 'HD'}</span>
                        <div class="play-overlay"><i class="fa-solid fa-play"></i></div>
                    </div>
                    <div class="video-meta">
                        <h3 class="video-title">${vid.title}</h3>
                        <div class="stats">
                            <span class="author">${author}</span>
                            <span class="dot">•</span>
                            <span>${vid.views || 0} views</span>
                            <span class="dot">•</span>
                            <span>${timeAgo}</span>
                        </div>
                    </div>
                </article>
            `;
            container.innerHTML += html;
        });
    },

    realizarBusca: function() {
        const input = document.getElementById('search-input');
        if(input) {
            this.loadVideos(input.value);
        }
    },

    // --- CONTROLE DE UI (MODAL E ABAS) ---
    ui: {
        abrirModalAuth: function(tab) {
            const modal = document.getElementById('auth-modal');
            if(modal) {
                modal.style.display = 'flex';
                this.switchAuthTab(tab);
            }
        },
        
        fecharModal: function() {
            const modal = document.getElementById('auth-modal');
            if(modal) modal.style.display = 'none';
        },

        switchAuthTab: function(tabName) {
            // Reseta visual dos botões
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
            // Esconde todos os formulários
            document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active-form'));

            if (tabName === 'login') {
                const btnLogin = document.querySelector('.tab-btn:nth-child(1)');
                const formLogin = document.getElementById('form-login');
                if(btnLogin) btnLogin.classList.add('active');
                if(formLogin) formLogin.classList.add('active-form');
            } else {
                const btnRegister = document.querySelector('.tab-btn:nth-child(2)');
                const formRegister = document.getElementById('form-register');
                if(btnRegister) btnRegister.classList.add('active');
                if(formRegister) formRegister.classList.add('active-form');
            }
        }
    },

    // --- AUTENTICAÇÃO ---
    auth: {
        login: async function(e) {
            e.preventDefault();
            const btn = e.target.querySelector('button');
            const originalText = btn.innerText;
            
            // Feedback Visual
            btn.innerText = "Verificando...";
            btn.style.opacity = "0.7";
            btn.disabled = true;

            const email = document.getElementById('login-email').value;
            const pass = document.getElementById('login-pass').value;

            try {
                const res = await fetch('/auth/login', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({ email, password: pass })
                });
                const data = await res.json();

                if(res.ok) {
                    // Salva sessão
                    localStorage.setItem('axtron_token', data.token);
                    localStorage.setItem('axtron_user', JSON.stringify(data.user));
                    window.location.reload(); // Recarrega para aplicar login
                } else {
                    alert(data.error || 'Credenciais inválidas!');
                }
            } catch(err) {
                console.error(err);
                alert('Erro ao conectar com o servidor.');
            } finally {
                btn.innerText = originalText;
                btn.style.opacity = "1";
                btn.disabled = false;
            }
        },

        register: function(e) {
            e.preventDefault();
            alert("Módulo de registro em desenvolvimento (Backend v2)");
        }
    },

    // --- FUNÇÕES UTILITÁRIAS ---
    helpers: {
        timeSince: function(date) {
            const seconds = Math.floor((new Date() - date) / 1000);
            let interval = seconds / 31536000;
            if (interval > 1) return Math.floor(interval) + " anos";
            interval = seconds / 2592000;
            if (interval > 1) return Math.floor(interval) + " meses";
            interval = seconds / 86400;
            if (interval > 1) return Math.floor(interval) + "d";
            interval = seconds / 3600;
            if (interval > 1) return Math.floor(interval) + "h";
            return Math.floor(seconds / 60) + "m";
        }
    }
};

// --- INICIALIZAÇÃO E EXPOSIÇÃO GLOBAL ---
document.addEventListener('DOMContentLoaded', () => App.init());

// Funções globais para o HTML (onclick="")
window.abrirModalAuth = (t) => App.ui.abrirModalAuth(t);
window.fecharModal = () => App.ui.fecharModal();
window.switchAuthTab = (t) => App.ui.switchAuthTab(t);
window.loginUsuario = (e) => App.auth.login(e);
window.registrarUsuario = (e) => App.auth.register(e);
window.realizarBusca = () => App.realizarBusca();
