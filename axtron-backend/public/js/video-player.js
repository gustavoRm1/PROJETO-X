// AXTRON Video Player - Standalone para video.html

// Banco de Dados Mockado (O mesmo do app.js para consistência)
const db = {
    videos: [
        { id: 1, title: "Novinha no Espelho do Quarto", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4", views: "1.2M", percent: "98%" },
        { id: 2, title: "Cena Exclusiva Vazada", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4", views: "850k", percent: "95%" },
        { id: 3, title: "Bastidores da Gravação", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4", views: "2.1M", percent: "99%" },
        { id: 4, title: "Viral do Tiktok Proibido", url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4", views: "500k", percent: "92%" },
    ]
};

document.addEventListener('DOMContentLoaded', () => {
    // 1. Pegar o ID da URL (?id=1)
    const params = new URLSearchParams(window.location.search);
    const videoId = parseInt(params.get('id')) || 1; // Default para 1 se não achar

    // 2. Carregar Dados do Vídeo Principal
    const videoData = db.videos.find(v => v.id === videoId) || db.videos[0];
    document.getElementById('videoTitle').innerText = videoData.title;
    const videoEl = document.getElementById('mainVideo');
    videoEl.src = videoData.url;
    // Autoplay (pode ser bloqueado, então tratamos o catch)
    videoEl.play().catch(() => {
        console.log("Autoplay bloqueado pelo browser, esperando interação do usuário.");
    });

    // 3. Gerar Sidebar de Relacionados (Loop duplicado para volume)
    const relatedFeed = document.getElementById('relatedFeed');
    const relatedVideos = [...db.videos, ...db.videos].filter(v => v.id !== videoId);

    relatedVideos.forEach(vid => {
        const card = document.createElement('div');
        card.className = 'rel-card';
        card.onclick = () => window.location.href = `video.html?id=${vid.id}`;
        card.innerHTML = `
            <img src="https://placehold.co/200x120/222/fff?text=Thumb" class="rel-thumb" alt="${vid.title}">
            <div class="rel-info">
                <h4>${vid.title}</h4>
                <span>${vid.views} visualizações</span>
            </div>
        `;
        relatedFeed.appendChild(card);
    });

    // 4. Lógica de Anúncio no Pause (Monetização)
    const wrapper = document.getElementById('playerWrapper');

    videoEl.addEventListener('pause', () => {
        if (!videoEl.ended) {
            wrapper.classList.add('paused');
        }
    });

    videoEl.addEventListener('play', () => {
        wrapper.classList.remove('paused');
    });

    // Função global para fechar o AD
    window.closeAd = function() {
        wrapper.classList.remove('paused');
        videoEl.play();
    };
});
