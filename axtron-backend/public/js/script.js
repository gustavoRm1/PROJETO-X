/* AXTRON TUBE ENGINE */

// Dados Simulados (Padrão Tube)
const MOCK_VIDEOS = [
    { 
        id: 1, 
        title: "Vazou no Privacy: Safira Hot mostrando tudo na piscina 😈", 
        thumb: "https://via.placeholder.com/640x360/111/00ff88?text=THUMB+1", // Substitua por URL real
        preview: "https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-1232-large.mp4",
        duration: "12:40", 
        quality: "4K", 
        views: "1.2M", 
        time: "2 dias atrás", 
        uploader: "Safira Hot",
        avatar: "https://ui-avatars.com/api/?name=Safira&background=random"
    },
    { 
        id: 2, 
        title: "Amador BR: Novinha se exibindo na webcam (Completo)", 
        thumb: "https://via.placeholder.com/640x360/111/ff0044?text=THUMB+2", 
        preview: "https://assets.mixkit.co/videos/preview/mixkit-woman-dancing-under-neon-lights-1282-large.mp4",
        duration: "08:15", 
        quality: "HD", 
        views: "850K", 
        time: "5 horas atrás", 
        uploader: "AnonX",
        avatar: "https://ui-avatars.com/api/?name=Anon&background=000&color=fff"
    },
    { 
        id: 3, 
        title: "Compilado melhores momentos da semana (VIP)", 
        thumb: "https://via.placeholder.com/640x360/111/00b7ff?text=THUMB+3", 
        preview: "https://assets.mixkit.co/videos/preview/mixkit-red-lights-in-dark-room-1233-large.mp4",
        duration: "22:00", 
        quality: "1080p", 
        views: "3.4M", 
        time: "1 semana atrás", 
        uploader: "AxtronOfficial",
        avatar: "https://ui-avatars.com/api/?name=Ax&background=00ff88&color=000"
    }
];

// Gera mais dados fake para encher a tela
for(let i=0; i<5; i++) MOCK_VIDEOS.push(...MOCK_VIDEOS); 

document.addEventListener('DOMContentLoaded', () => {
    renderTubeFeed();
});

function renderTubeFeed() {
    const container = document.getElementById('tube-feed');
    container.innerHTML = ''; // Limpa loader

    MOCK_VIDEOS.forEach((vid, index) => {
        // ID único para controle de preview
        const uniqueID = `vid-${index}`;
        
        const html = `
            <article class="video-card" onclick="irParaVideo('${vid.id}')">
                <div class="thumb-container" id="${uniqueID}">
                    <img src="${vid.thumb}" class="poster-img" alt="Thumbnail">
                    
                    <video src="${vid.preview}" class="preview-video" muted loop playsinline></video>
                    
                    <span class="duration">${vid.duration}</span>
                    <span class="quality-badge">${vid.quality}</span>
                </div>
                
                <div class="video-meta">
                    <div class="uploader-pic">
                        <img src="${vid.avatar}" alt="${vid.uploader}">
                    </div>
                    <div class="info-text">
                        <h3 class="video-title">${vid.title}</h3>
                        <div class="stats">
                            <span>${vid.uploader}</span>
                            <span class="dot">•</span>
                            <span>${vid.views} views</span>
                            <span class="dot">•</span>
                            <span>${vid.time}</span>
                        </div>
                    </div>
                    <div class="action-dots">
                        <i class="fa-solid fa-ellipsis-vertical" style="color:#555"></i>
                    </div>
                </div>
            </article>
        `;
        container.innerHTML += html;
    });

    initSmartPreviews();
}

// LÓGICA DE PREVIEW INTELIGENTE (Padrão Pornhub/Xvideos Mobile)
function initSmartPreviews() {
    // Desktop: Hover (Mouse)
    if (window.matchMedia("(min-width: 768px)").matches) {
        document.querySelectorAll('.thumb-container').forEach(card => {
            const video = card.querySelector('video');
            card.addEventListener('mouseenter', () => {
                card.classList.add('playing');
                video.play();
            });
            card.addEventListener('mouseleave', () => {
                card.classList.remove('playing');
                video.pause();
                video.currentTime = 0;
            });
        });
    } 
    // Mobile: Intersection Observer (Scroll)
    else {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const card = entry.target;
                const video = card.querySelector('video');
                
                if (entry.isIntersecting) {
                    // Está no centro da tela? Toca.
                    card.classList.add('playing');
                    video.play().catch(() => {}); // Catch evita erros de autoplay
                } else {
                    // Saiu da tela? Para.
                    card.classList.remove('playing');
                    video.pause();
                }
            });
        }, { threshold: 0.7 }); // 70% visível para ativar

        document.querySelectorAll('.thumb-container').forEach(el => observer.observe(el));
    }
}

// Navegação
function irParaVideo(id) {
    // Aqui você redirecionaria para video.html?id=...
    console.log("Abrindo vídeo ID:", id);
    alert("Indo para o player do vídeo " + id);
}

// Modal Control
function abrirModal() { document.getElementById('signup-modal').style.display = 'flex'; }
function fecharModal() { document.getElementById('signup-modal').style.display = 'none'; }
