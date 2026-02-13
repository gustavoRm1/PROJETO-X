const videoApp = {
    state: {
        video: null,
        viewSent: false,
        comments: [
            { user: 'João Silva', text: 'Conteúdo top demais! 🔥', time: 'Há 5 min', avatar: 'https://placehold.co/50x50/111/333' },
            { user: 'Marcos P.', text: 'Vale cada centavo o VIP.', time: 'Há 12 min', avatar: 'https://placehold.co/50x50/222/444' }
        ]
    },

    init: async function() {
        await this.loadVideo();
        this.renderComments();
        this.renderRelated();
        this.setupPlayer();
    },

    getVideoId: function() {
        return new URLSearchParams(window.location.search).get('id');
    },

    getAuthHeaders: function() {
        const token = localStorage.getItem('axtron_token');
        return token ? { Authorization: `Bearer ${token}` } : {};
    },

    loadVideo: async function() {
        const id = this.getVideoId();
        if (!id) return;

        try {
            const response = await fetch(`/posts/${id}`, { headers: this.getAuthHeaders() });
            if (!response.ok) throw new Error('Falha ao carregar vídeo');

            const data = await response.json();
            this.state.video = data;
            this.applyVideoData();
        } catch (err) {
            console.error(err);
            const title = document.getElementById('videoTitle');
            if (title) title.textContent = 'Erro ao carregar vídeo';
        }
    },

    applyVideoData: function() {
        const video = this.state.video;
        if (!video) return;

        const title = document.getElementById('videoTitle');
        const stats = document.getElementById('videoStats');
        const player = document.getElementById('mainVideo');
        const channel = document.getElementById('channelName');
        const likeCount = document.getElementById('likeCount');

        if (title) title.textContent = video.title || 'Sem título';
        if (stats) stats.textContent = `${video.views || 0} Visualizações • Publicado recentemente`;
        if (channel) channel.innerHTML = `${video.username || 'Criador'} <i class="ph ph-seal-check-fill verified-icon"></i>`;
        if (likeCount) likeCount.textContent = String(video.likes_count || 0);

        if (player) {
            const videoSrc = video.video_url || video.video;
            if (videoSrc) {
                const src = /^https?:\/\//i.test(videoSrc) ? videoSrc : `/uploads/${videoSrc}`;
                player.src = src;
            }

            if (video.thumbnail_url) {
                player.poster = video.thumbnail_url;
            }
        }
    },

    setupPlayer: function() {
        const video = document.getElementById('mainVideo');
        const wrapper = document.getElementById('playerWrapper');
        if (!video || !wrapper) return;

        video.addEventListener('pause', () => {
            if (!video.ended && video.currentTime > 0) wrapper.classList.add('paused');
        });

        video.addEventListener('play', async () => {
            wrapper.classList.remove('paused');
            if (!this.state.viewSent && this.state.video?.id) {
                this.state.viewSent = true;
                await this.registerView();
            }
        });

        window.closeAd = () => {
            wrapper.classList.remove('paused');
            video.play();
        };
    },

    registerView: async function() {
        try {
            const response = await fetch(`/posts/${this.state.video.id}/view`, { method: 'POST' });
            if (!response.ok) return;

            const data = await response.json();
            const stats = document.getElementById('videoStats');
            if (stats) stats.textContent = `${data.views || 0} Visualizações • Publicado recentemente`;
        } catch (err) {
            console.error(err);
        }
    },

    renderComments: function() {
        const list = document.getElementById('commentsList');
        if (!list) return;

        list.innerHTML = this.state.comments.map((c) => `
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

    renderRelated: async function() {
        const feed = document.getElementById('relatedFeed');
        if (!feed) return;

        try {
            const response = await fetch('/posts');
            const videos = await response.json();
            const related = (videos || []).filter((item) => String(item.id) !== String(this.getVideoId())).slice(0, 8);

            if (!related.length) {
                feed.innerHTML = '<p style="color:#999;">Sem relacionados no momento.</p>';
                return;
            }

            feed.innerHTML = related.map((item) => `
                <div class="related-item" onclick="window.location.href='video.html?id=${item.id}'">
                    <img src="${item.thumbnail_url || 'https://placehold.co/320x180/222/555?text=Video'}" class="related-thumb">
                    <div class="related-info">
                        <h4>${item.title}</h4>
                        <span>${item.views || 0} Visualizações</span>
                        <span>@${item.username || 'creator'}</span>
                    </div>
                </div>
            `).join('');
        } catch (err) {
            console.error(err);
            feed.innerHTML = '<p style="color:#999;">Erro ao carregar relacionados.</p>';
        }
    },

    actions: {
        like: async function(btn) {
            if (!app.state.isLogged) {
                app.ui.openLoginModal('Faça login para curtir.');
                return;
            }

            if (!videoApp.state.video?.id) return;

            try {
                const response = await fetch(`/posts/${videoApp.state.video.id}/like`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...videoApp.getAuthHeaders()
                    }
                });

                const data = await response.json();
                if (!response.ok) {
                    alert(data.error || 'Erro ao curtir vídeo.');
                    return;
                }

                const icon = btn.querySelector('i');
                const count = document.getElementById('likeCount');

                btn.classList.toggle('liked', data.liked);
                if (icon) {
                    icon.classList.toggle('ph-thumbs-up-fill', data.liked);
                    icon.classList.toggle('ph-thumbs-up', !data.liked);
                }
                if (count) count.textContent = String(data.likes_count || 0);
            } catch (err) {
                console.error(err);
            }
        },

        share: function() {
            const link = window.location.href;
            const toast = document.getElementById('toast');
            const copy = () => {
                if (toast) {
                    toast.classList.add('show');
                    setTimeout(() => toast.classList.remove('show'), 2000);
                }
            };
            if (navigator.clipboard?.writeText) {
                navigator.clipboard.writeText(link).then(copy).catch(copy);
            } else {
                const tmp = document.createElement('input');
                tmp.value = link;
                document.body.appendChild(tmp);
                tmp.select();
                document.execCommand('copy');
                document.body.removeChild(tmp);
                copy();
            }
        },

        postComment: function() {
            if (!app.state.isLogged) {
                app.ui.openLoginModal('Faça login para comentar.');
                return;
            }
            const input = document.getElementById('commentInput');
            if (!input || !input.value.trim()) return;
            videoApp.state.comments.unshift({
                user: app.state.user.name,
                text: input.value,
                time: 'Agora mesmo',
                avatar: app.state.user.avatar
            });
            input.value = '';
            videoApp.renderComments();
        }
    }
};

document.addEventListener('DOMContentLoaded', () => videoApp.init());
