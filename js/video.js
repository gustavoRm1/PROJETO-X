const videoApp = {
    state: {
        comments: [
            { user: "João Silva", text: "Conteúdo top demais! 🔥", time: "Há 5 min", avatar: "https://placehold.co/50x50/111/333" },
            { user: "Marcos P.", text: "Vale cada centavo o VIP.", time: "Há 12 min", avatar: "https://placehold.co/50x50/222/444" },
            { user: "Ana C.", text: "Amei o teaser 😍", time: "Há 1 hora", avatar: "https://placehold.co/50x50/333/555" }
        ]
    },

    init: function() {
        this.renderComments();
        this.renderRelated();
        this.setupPlayer();
    },

    setupPlayer: function() {
        const video = document.getElementById('mainVideo');
        const wrapper = document.getElementById('playerWrapper');
        if (!video || !wrapper) return;
        if (window.Hls && Hls.isSupported()) {
            // Em produção: const hls = new Hls(); hls.loadSource(url); hls.attachMedia(video);
        }
        video.addEventListener('pause', () => { if (!video.ended && video.currentTime > 0) wrapper.classList.add('paused'); });
        video.addEventListener('play', () => wrapper.classList.remove('paused'));
        window.closeAd = () => { wrapper.classList.remove('paused'); video.play(); };
    },

    renderComments: function() {
        const list = document.getElementById('commentsList');
        if (!list) return;
        list.innerHTML = this.state.comments.map(c => `
            <div class="comment-item">
                <img src="${c.avatar}" class="user-avatar-small">
                <div class="comment-body">
                    <h5>${c.user} <span style="color:#666; font-weight:400; font-size:0.7rem;">• ${c.time}</span></h5>
                    <p>${c.text}</p>
                    <div class="comment-meta">
                        <span style="cursor:pointer">Responder</span>
                        <span style="cursor:pointer"><i class="ph ph-heart"></i></span>
                    </div>
                </div>
            </div>
        `).join('');
    },

    renderRelated: function() {
        const feed = document.getElementById('relatedFeed');
        if (!feed) return;
        feed.innerHTML = Array(8).fill(0).map((_, i) => `
            <div class="related-item" onclick="window.location.reload()">
                <img src="https://placehold.co/320x180/${Math.floor(Math.random()*999)}/fff?text=Video+${i+1}" class="related-thumb">
                <div class="related-info">
                    <h4>Conteúdo Exclusivo Sugerido #${i+1}</h4>
                    <span>${(Math.random()*500).toFixed(1)}k Visualizações</span>
                    <span>Há ${Math.floor(Math.random()*10)+1} horas</span>
                </div>
            </div>
        `).join('');
    },

    actions: {
        like: function(btn) {
            if(!app.state.isLogged) { app.ui.openLoginModal("Faça login para curtir."); return; }
            const icon = btn.querySelector('i');
            const count = btn.querySelector('.count');
            if (btn.classList.contains('liked')) {
                btn.classList.remove('liked');
                icon.classList.replace('ph-thumbs-up-fill', 'ph-thumbs-up');
                btn.style.color = '#ccc';
            } else {
                btn.classList.add('liked');
                icon.classList.replace('ph-thumbs-up', 'ph-thumbs-up-fill');
                btn.style.color = 'var(--primary)';
                icon.style.transform = "scale(1.3)";
                setTimeout(() => icon.style.transform = "scale(1)", 200);
            }
            if(count) {
                const n = parseInt(count.textContent.replace(/\D/g,'')) || 0;
                count.textContent = btn.classList.contains('liked') ? `${n + 1}k` : `${Math.max(0, n - 1)}k`;
            }
        },

        share: function() {
            const link = window.location.href;
            const toast = document.getElementById('toast');
            const copy = () => {
                if(toast) { toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2000); }
            };
            if(navigator.clipboard?.writeText) {
                navigator.clipboard.writeText(link).then(copy).catch(copy);
            } else {
                const tmp = document.createElement('input');
                tmp.value = link; document.body.appendChild(tmp); tmp.select(); document.execCommand('copy'); document.body.removeChild(tmp); copy();
            }
        },

        postComment: function() {
            if(!app.state.isLogged) { app.ui.openLoginModal("Faça login para comentar."); return; }
            const input = document.getElementById('commentInput');
            if(!input || !input.value.trim()) return;
            videoApp.state.comments.unshift({
                user: app.state.user.name,
                text: input.value,
                time: "Agora mesmo",
                avatar: app.state.user.avatar
            });
            input.value = "";
            videoApp.renderComments();
        }
    }
};

document.addEventListener('DOMContentLoaded', () => videoApp.init());
