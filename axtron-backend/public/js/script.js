/* JS DEFINITIVO - AXTRON HOME */

// Dados de Exemplo (Enquanto API não conecta)
const MOCK_DATA = [
    { id: 1, user: "@safira_vip", desc: "O que acontece no cofre fica no cofre... 🤫", likes: "14K", comments: "302", src: "https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-1232-large.mp4", music: "Original Sound - Safira" },
    { id: 2, user: "@aninha_leaks", desc: "Video completo liberado para membros!", likes: "5K", comments: "120", src: "https://assets.mixkit.co/videos/preview/mixkit-woman-dancing-under-neon-lights-1282-large.mp4", music: "Funk Proibidão 2026" },
];

document.addEventListener('DOMContentLoaded', () => {
    carregarFeed();
});

function carregarFeed() {
    const feedContainer = document.getElementById('feed-view');
    feedContainer.innerHTML = ''; // Limpa o loader

    MOCK_DATA.forEach(video => {
        // Cria a estrutura HTML completa para cada vídeo
        const html = `
            <div class="video-item">
                <video class="video-player" src="${video.src}" loop playsinline onclick="togglePlay(this)"></video>
                
                <div class="video-gradient"></div>

                <div class="video-info">
                    <div class="username">${video.user} <i class="fa-solid fa-circle-check" style="color: #00ff88; font-size:12px;"></i></div>
                    <div class="desc">${video.desc}</div>
                    <div class="music-tag"><i class="fa-solid fa-music"></i> ${video.music}</div>
                </div>

                <div class="sidebar-actions">
                    <div class="avatar-wrapper" onclick="abrirModal()">
                        <img src="https://ui-avatars.com/api/?name=${video.user}&background=random" alt="User">
                        <div class="plus-badge"><i class="fa-solid fa-plus"></i></div>
                    </div>

                    <div class="action-btn" onclick="animarLike(this)">
                        <i class="fa-solid fa-heart"></i>
                        <span>${video.likes}</span>
                    </div>

                    <div class="action-btn">
                        <i class="fa-solid fa-comment-dots"></i>
                        <span>${video.comments}</span>
                    </div>

                    <div class="action-btn" onclick="abrirModal()">
                        <i class="fa-solid fa-share"></i>
                        <span>Share</span>
                    </div>
                </div>
            </div>
        `;
        feedContainer.innerHTML += html;
    });

    // Ativa o Autoplay Inteligente
    iniciarObserver();
}

// Autoplay: Toca apenas o vídeo visível
function iniciarObserver() {
    const options = { threshold: 0.6 }; // 60% visível para tocar
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target.querySelector('video');
            if(entry.isIntersecting) {
                video.play();
            } else {
                video.pause();
                video.currentTime = 0; // Reseta para economizar bateria
            }
        });
    }, options);

    document.querySelectorAll('.video-item').forEach(el => observer.observe(el));
}

// Micro-interações
function togglePlay(video) {
    if(video.paused) video.play();
    else video.pause();
}

function animarLike(btn) {
    const icon = btn.querySelector('i');
    if (icon.style.color === 'rgb(255, 0, 85)') {
        icon.style.color = 'white';
    } else {
        icon.style.color = '#ff0055';
        icon.style.transform = 'scale(1.3)';
        setTimeout(() => icon.style.transform = 'scale(1)', 200);
    }
}

// Modal Control
function abrirModal() { document.getElementById('signup-modal').style.display = 'flex'; }
function fecharModal() { document.getElementById('signup-modal').style.display = 'none'; }
