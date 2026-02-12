function toggleUploadModal() {
    document.getElementById('uploadModal').classList.toggle('open');
}

document.addEventListener('DOMContentLoaded', () => {
    const feed = document.getElementById('user-feed');
    // Mock Videos do Criador
    feed.innerHTML = `
        <article class="card">
            <div class="card-media-wrapper">
                <span class="badge">GRÁTIS</span>
                <img src="https://placehold.co/400x600/111/333" class="card-thumb">
                <div class="card-overlay"><h4>Meu Video #1</h4></div>
            </div>
        </article>
        <article class="card">
            <div class="card-media-wrapper">
                <span class="badge" style="background:var(--primary)">PREMIUM</span>
                <img src="https://placehold.co/400x600/222/444" class="card-thumb">
                <div class="card-overlay"><h4>Conteúdo VIP</h4></div>
            </div>
        </article>
    `;
});