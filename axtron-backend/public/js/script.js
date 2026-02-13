/* === AXTRON CORE ENGINE - API CONECTADA === */

const AppState = {
    user: JSON.parse(localStorage.getItem('axtron_user')) || null,
    token: localStorage.getItem('axtron_token') || null,
    videos: []
};

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});

async function initApp() {
    await loadFeed(); // Busca dados reais do banco
    renderVault();    // Renderiza a aba Vault
    checkLoginState(); // Ajusta UI baseada no login
}

// 1. BUSCA O FEED NO BACKEND
async function loadFeed() {
    const feedView = document.getElementById('feed-view');
    feedView.innerHTML = '<div class="loading"><i class="fa-solid fa-circle-notch fa-spin"></i> Carregando Feed...</div>';

    try {
        // Bate na API que criamos no Docker
        const response = await fetch('/posts', {
            headers: {
                'Authorization': AppState.token ? `Bearer ${AppState.token}` : ''
            }
        });

        if (!response.ok) throw new Error('Erro na API');
        
        const data = await response.json();
        AppState.videos = data; // Salva na memória
        renderFeed(data);
        setupIntersectionObserver(); // Liga o Autoplay APÓS carregar os vídeos

    } catch (error) {
        console.error(error);
        feedView.innerHTML = '<div class="error-msg"><p>Erro ao carregar vídeos.</p><button onclick="loadFeed()">Tentar Novamente</button></div>';
    }
}

// 2. RENDERIZA O FEED (TikTok Style)
function renderFeed(videos) {
    const feed = document.getElementById('feed-view');
    feed.innerHTML = ''; 

    if (videos.length === 0) {
        feed.innerHTML = '<div class="empty-feed"><h3>Nenhum vídeo ainda 😢</h3></div>';
        return;
    }

    videos.forEach(vid => {
        // Lógica VIP Real:
        // Se é PREMIUM e o usuário NÃO está logado => Bloqueia
        const isLocked = vid.is_premium && !AppState.token;
        
        // Tratamento da URL do vídeo (se veio do upload ou link externo)
        let videoSrcUrl = vid.video_url;
        if (!videoSrcUrl.startsWith('http')) {
            videoSrcUrl = `/uploads/${videoSrcUrl}`;
        }

        const videoTag = isLocked 
            ? '' // Não coloca o src para não gastar dados se estiver bloqueado
            : `src="${videoSrcUrl}" loop muted playsinline`;

        const vipClass = isLocked ? 'vip-blur' : '';
        
        // Overlay de Bloqueio
        const vipOverlay = isLocked 
            ? `<div class="locked-overlay" onclick="abrirModal()">
                 <i class="fa-solid fa-lock fa-3x"></i>
                 <p>CONTEÚDO VIP</p>
                 <button class="unlock-btn">DESBLOQUEAR</button>
               </div>` 
            : '';

        // Formatação dos números (fake stats baseados no ID para parecer real por enquanto)
        const likes = vid.views ? (vid.views / 10).toFixed(0) : '0';
        
        const html = `
            <div class="video-container ${vipClass}" data-id="${vid.id}">
                ${vipOverlay}
                <video class="video-player" ${videoTag}></video>
                
                <div class="actions-sidebar">
                    <div class="action-btn" onclick="animarLike(this)">
                        <i class="fa-solid fa-heart"></i>
                        <span>${likes}</span>
                    </div>
                    <div class="action-btn">
                        <i class="fa-solid fa-comment-dots"></i>
                        <span>${(Math.random() * 100).toFixed(0)}</span>
                    </div>
                    <div class="action-btn" onclick="compartilhar('${vid.title}')">
                        <i class="fa-solid fa-share"></i>
                        <span>Share</span>
                    </div>
                </div>

                <div class="video-ui">
                    <div class="video-info">
                        <div class="username">@${vid.username || 'usuario_vip'} ${vid.is_premium ? '<i class="fa-solid fa-circle-check" style="color:#00ff88"></i>' : ''}</div>
                        <div class="description">${vid.title}</div>
                    </div>
                </div>
            </div>
        `;
        feed.innerHTML += html;
    });
}

// 3. AUTOPLAY INTELIGENTE (Engenharia Musk)
function setupIntersectionObserver() {
    const options = { root: null, threshold: 0.6 }; 
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target.querySelector('video');
            
            // Se não tem video (ex: card bloqueado sem src), ignora
            if (!video || !video.hasAttribute('src')) return;

            if (entry.isIntersecting && !entry.target.classList.contains('vip-blur')) {
                // Tenta tocar
                const playPromise = video.play();
                if (playPromise !== undefined) {
                    playPromise.then(_ => {
                        // Play automático funcionou
                        video.muted = false; // Tenta desmutar (alguns browsers bloqueiam)
                    }).catch(error => {
                        // Autoplay bloqueado pelo browser
                        video.muted = true;
                        video.play();
                    });
                }
            } else {
                video.pause(); 
                video.currentTime = 0; 
            }
        });
    }, options);

    document.querySelectorAll('.video-container').forEach(el => observer.observe(el));
}

// 4. SISTEMA DE ABAS
function switchTab(tabName) {
    document.getElementById('feed-view').style.display = 'none';
    document.getElementById('vault-view').style.display = 'none';
    
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

    if (tabName === 'feed') {
        document.getElementById('feed-view').style.display = 'block';
        // Recalcular autoplay quando volta pra aba
        setupIntersectionObserver();
    } else if (tabName === 'vault') {
        document.getElementById('vault-view').style.display = 'block';
    }
    
    // Marca o botão ativo (lógica simples baseada na ordem)
    const index = tabName === 'feed' ? 0 : 1;
    const navItems = document.querySelectorAll('.nav-item');
    if(navItems[index]) navItems[index].classList.add('active');
}

// 5. RENDERIZA O VAULT (Placeholder para futuro)
function renderVault() {
    const grid = document.getElementById('vault-grid');
    if(!grid) return;
    grid.innerHTML = '';
    // Mock visual apenas para preencher espaço
    for(let i=0; i<6; i++) {
        grid.innerHTML += `
            <div class="grid-item" onclick="abrirModal()">
                <div class="locked-overlay">
                    <i class="fa-solid fa-lock"></i>
                </div>
                <img src="https://via.placeholder.com/300x500/111/333?text=VIP+${i+1}" alt="VIP">
            </div>
        `;
    }
}

// 6. UI HELPERS
function abrirModal() { 
    const modal = document.getElementById('signup-modal') || document.getElementById('loginModal');
    if(modal) modal.style.display = 'flex'; 
    else alert('Faça login para continuar');
}

function fecharModal() { 
    const modal = document.getElementById('signup-modal') || document.getElementById('loginModal');
    if(modal) modal.style.display = 'none'; 
}

function checkLoginState() {
    // Se o user estiver logado, pode esconder botões de login ou mudar o header
    if (AppState.token) {
        console.log("Usuário logado: Modo VIP Ativo");
    }
}

function animarLike(btn) {
    const icon = btn.querySelector('i');
    if (icon.style.color === 'rgb(255, 0, 80)') {
        icon.style.color = 'white';
    } else {
        icon.style.color = '#ff0050';
        icon.style.transform = 'scale(1.3)';
        setTimeout(() => icon.style.transform = 'scale(1)', 200);
    }
}

function compartilhar(title) {
    if (navigator.share) {
        navigator.share({
            title: 'Axtron VIP',
            text: `Assista ${title} no Axtron!`,
            url: window.location.href
        });
    } else {
        alert('Link copiado!');
    }
}
