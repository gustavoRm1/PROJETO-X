const adminApp = {
    // --- DATABASE ---
    db: {
        users: [
            { id: 101, name: "Carlos Henrique", email: "carlos@gmail.com", avatar: "https://placehold.co/100x100/111/fff?text=CH", ip: "189.23.45.12", device: "iPhone 14", ltv: 450.00, plan: "Anual", churnRisk: "Low", history: [{action: "Login", time: "14:02"}] },
            { id: 102, name: "Marcos Paulo", email: "marcos@hotmail.com", avatar: "https://placehold.co/100x100/222/fff?text=MP", ip: "201.12.99.01", device: "Samsung S21", ltv: 0.00, plan: "Free", churnRisk: "High", history: [{action: "Cadastro", time: "Há 4 dias"}] },
        ],
        models: [
            { id: 1, name: "Key Alves", platform: "OnlyFans", count: 12, thumb: "https://placehold.co/200x250/111/333?text=Key", views: 154000, lastUpdate: "2023-10-25" },
            { id: 2, name: "MC Pipokinha", platform: "Privacy", count: 45, thumb: "https://placehold.co/200x250/222/444?text=Pipoka", views: 289000, lastUpdate: new Date().toISOString().split('T')[0] },
            { id: 3, name: "Andressa Urach", platform: "Privacy", count: 8, thumb: "https://placehold.co/200x250/333/555?text=Urach", views: 98000, lastUpdate: "2023-10-20" },
            { id: 4, name: "Kerolay", platform: "OnlyFans", count: 22, thumb: "https://placehold.co/200x250/444/666?text=Kerolay", views: 210000, lastUpdate: "2023-10-26" },
        ],
        finance: [
            { id: "TRX-9821", gateway: "PerfectPay", val: 19.97, status: "Aprovado", date: "Hoje 14:20" },
            { id: "TRX-9820", gateway: "Kirvano", val: 22.97, status: "Aprovado", date: "Hoje 14:15" },
            { id: "TRX-9819", gateway: "PerfectPay", val: 19.97, status: "Recusado", date: "Hoje 14:10" },
        ]
    },

    init: function() {
        console.log("AXTRON GOD MODE: V13.0 POLYMATH EDITION ");
        this.render.crm();
        this.render.vazados(this.db.models);
        this.render.finance();
        this.ui.initCharts();
        this.simulation.startLiveFeed();
    },

    // --- UI CONTROLLERS ---
    ui: {
        switchTab: function(tabId) {
            document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active', 'hidden'));
            document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
            event.currentTarget.classList.add('active');
            document.getElementById(`tab-${tabId}`).classList.remove('hidden');
            document.getElementById(`tab-${tabId}`).classList.add('active');
            document.getElementById('pageTitle').innerText = tabId === 'dashboard' ? 'War Room' : (tabId === 'crm' ? 'CRM Intelligence' : (tabId === 'vazados' ? 'Gestão de Ativos' : 'Financeiro'));
        },
        initCharts: function() {
            const ctx = document.getElementById('revenueChart').getContext('2d');
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'],
                    datasets: [{ label: 'Receita (R$)', data: [1200, 1900, 3000, 5000, 2000, 3000, 4200], borderColor: '#00ff88', backgroundColor: 'rgba(0, 255, 136, 0.1)', fill: true, tension: 0.4 }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { grid: { color: '#222' } }, x: { grid: { display: false } } } }
            });
        },
        openDrawer: function(id) { const user = adminApp.db.users.find(u => u.id === id); if(user) { adminApp.render.deepDive(user); document.getElementById('userDeepDiveModal').classList.add('open'); } },
        closeDrawer: function() { document.getElementById('userDeepDiveModal').classList.remove('open'); },
        
        openModelModal: function() { 
            document.getElementById('modelModalTitle').innerText = "Novo Ativo";
            document.getElementById('modelNameInput').value = "";
            document.getElementById('modelIdEdit').value = "";
            document.getElementById('vazadoModal').classList.add('open'); 
        },
        closeModelModal: function() { document.getElementById('vazadoModal').classList.remove('open'); },
        
        openContentModal: function(modelName) {
            document.getElementById('contentModalSubtitle').innerHTML = `Adicionando para: <strong>${modelName}</strong>`;
            document.getElementById('contentModal').classList.add('open');
        },
        closeContentModal: function() { document.getElementById('contentModal').classList.remove('open'); }
    },

    // --- AÇÕES ---
    actions: {
        searchModel: function() {
            const term = document.getElementById('modelSearch').value.toLowerCase();
            const filtered = adminApp.db.models.filter(m => m.name.toLowerCase().includes(term));
            adminApp.render.vazados(filtered);
        },
        sortModels: function(criteria) {
            let sorted = [...adminApp.db.models];
            if(criteria === 'views') {
                sorted.sort((a, b) => b.views - a.views);
                alert("Ordenado por: Potencial de Lucro (Views)");
            } else if (criteria === 'health') {
                sorted.sort((a, b) => new Date(b.lastUpdate) - new Date(a.lastUpdate));
                alert("Ordenado por: Saúde do Estoque (Recência)");
            }
            adminApp.render.vazados(sorted);
        },
        editModel: function(id) {
            const model = adminApp.db.models.find(m => m.id === id);
            if(model) {
                document.getElementById('modelModalTitle').innerText = `Editar ${model.name}`;
                document.getElementById('modelNameInput').value = model.name;
                document.getElementById('modelIdEdit').value = model.id;
                document.getElementById('vazadoModal').classList.add('open');
            }
        },
        addContentToModel: function(id) {
            const model = adminApp.db.models.find(m => m.id === id);
            if(model) {
                adminApp.ui.openContentModal(model.name);
            }
        },
        saveModel: function() {
            const name = document.getElementById('modelNameInput').value;
            alert(`Ativo '${name}' registrado na Blockchain interna!`);
            adminApp.ui.closeModelModal();
        },
        calculateSmartPrice: function() {
            const prices = [22.90, 29.90, 19.90];
            const bestPrice = prices[Math.floor(Math.random() * prices.length)];
            const priceInput = document.getElementById('videoPrice');
            if(priceInput) priceInput.value = bestPrice;
            alert(`IA analisou 14k transações similares. Preço ideal sugerido: R$ ${bestPrice}`);
        }
    },

    // --- RENDERIZADORES ---
    render: {
        crm: function() {
            const tbody = document.getElementById('crmTableBody');
            tbody.innerHTML = adminApp.db.users.map(u => `
                <tr>
                    <td><div style="display:flex; align-items:center; gap:10px;"><img src="${u.avatar}" style="width:35px; height:35px; border-radius:50%;"><div><div style="font-weight:bold; color:white;">${u.name}</div><div style="font-size:0.75rem; color:#666;">${u.email}</div></div></div></td>
                    <td><div class="fingerprint-info"><strong>${u.device}</strong><span>${u.ip}</span></div></td>
                    <td><div style="color:#ccc;">42h 15m</div></td>
                    <td><span style="font-family:'Space Grotesk'; color:white; font-weight:bold;">R$ ${u.ltv.toFixed(2)}</span></td>
                    <td><span class="churn-badge ${u.churnRisk.toLowerCase()}">${u.churnRisk}</span></td>
                    <td><button class="btn-action" style="padding:5px 10px;" onclick="alert('Abrindo Deep Dive...')"><i class="ph ph-eye"></i></button></td>
                </tr>
            `).join('');
        },

        vazados: function(data) {
            const list = data || adminApp.db.models;
            document.getElementById('modelCount').innerText = `${list.length} Ativos Gerenciados`;
            const grid = document.getElementById('modelsGrid');
            
            grid.innerHTML = list.map(m => {
                const daysSinceUpdate = Math.floor((new Date() - new Date(m.lastUpdate)) / (1000 * 60 * 60 * 24));
                const isHealthy = daysSinceUpdate < 7;
                const statusBadge = isHealthy 
                    ? `<div class="health-badge good">EM DIA</div>` 
                    : `<div class="health-badge bad">RISCO CHURN (${daysSinceUpdate}d)</div>`;

                return `
                <div class="model-card">
                    <div style="position:relative;">
                        <img src="${m.thumb}">
                        ${statusBadge}
                        ${m.views > 200000 ? '<div style="position:absolute; top:10px; right:10px; background:#ffd700; color:black; font-weight:bold; font-size:0.7rem; padding:2px 6px; border-radius:4px;"> HOT</div>' : ''}
                    </div>
                    <div class="model-info">
                        <span class="platform-tag">${m.platform}</span>
                        <h4>${m.name}</h4>
                        <div class="stats-bar">
                            <span>${m.count} Vídeos</span>
                            <span class="views-hot"><i class="ph ph-eye"></i> ${(m.views/1000).toFixed(1)}k</span>
                        </div>
                        <div style="display:flex; gap:10px;">
                            <button onclick="adminApp.actions.editModel(${m.id})" style="flex:1; background:#333; border:none; color:white; padding:8px; cursor:pointer; border-radius:6px; transition:0.2s;">Editar</button>
                            <button onclick="adminApp.actions.addContentToModel(${m.id})" style="flex:1; background:var(--primary); border:none; color:white; padding:8px; cursor:pointer; border-radius:6px; font-weight:bold; transition:0.2s;">+ Conteúdo</button>
                        </div>
                    </div>
                </div>
            `}).join('');
        },

        finance: function() {
            const tbody = document.getElementById('financeTableBody');
            tbody.innerHTML = adminApp.db.finance.map(t => `
                <tr>
                    <td style="font-family:monospace; color:#888;">${t.id}</td>
                    <td>${t.gateway}</td>
                    <td style="color:#00ff88; font-weight:bold;">R$ ${t.val}</td>
                    <td><span style="font-size:0.7rem; padding:2px 6px; border-radius:4px; background:${t.status === 'Aprovado' ? 'rgba(0,255,136,0.1)' : 'rgba(255,68,68,0.1)'}; color:${t.status === 'Aprovado' ? '#00ff88' : '#ff4444'}">${t.status}</span></td>
                    <td style="color:#888;">${t.date}</td>
                </tr>
            `).join('');
        },

        deepDive: function(u) {
            document.getElementById('ddName').innerHTML = `<span style="color:#888; font-size:0.8rem;">ID: ${u.id}</span> ${u.name}`;
            const historyHTML = u.history.map(h => `<li><span>${h.action}</span><span style="background:#222; padding:2px 6px; border-radius:4px; font-size:0.7rem;">${h.time}</span></li>`).join('');
            document.getElementById('ddContent').innerHTML = `
                <div style="text-align:center; margin-bottom:20px;">
                    <img src="${u.avatar}" style="width:80px; height:80px; border-radius:50%; border:3px solid var(--primary);">
                    <div style="margin-top:10px; font-weight:bold; font-size:1.2rem;">LTV: R$ ${u.ltv}</div>
                </div>
                <h4 style="color:var(--primary); margin-bottom:10px; border-bottom:1px solid #333;">Fingerprint</h4>
                <div class="dd-grid"><div class="dd-card"><span class="dd-label">IP</span><div class="dd-value" style="font-size:0.9rem;">${u.ip}</div></div><div class="dd-card"><span class="dd-label">Device</span><div class="dd-value" style="font-size:0.9rem;">${u.device}</div></div></div>
                <h4 style="color:white; margin-bottom:10px; border-bottom:1px solid #333;">Logs</h4>
                <ul class="dd-list">${historyHTML}</ul>
            `;
        }
    },

    // --- SIMULAÇÃO ---
    simulation: {
        startLiveFeed: function() {
            const feed = document.getElementById('transactionFeed');
            const actions = ["Venda R$ 19,97", "Venda R$ 22,97", "Venda R$ 49,90"];
            setInterval(() => {
                const item = document.createElement('div');
                item.className = 'transaction-item';
                const pick = actions[Math.floor(Math.random()*actions.length)];
                item.innerHTML = `<div class="t-user"><div class="t-avatar" style="background:#333"></div><div class="t-info"><span style="color:#eee; font-weight:600;">Nova Venda</span><span style="color:#666;">Pix</span></div></div><div class="t-amount">+${pick.replace('Venda ','')}</div>`;
                feed.insertBefore(item, feed.firstChild);
                if(feed.children.length > 8) feed.removeChild(feed.lastChild);
            }, 3000);
        },
        startServerPulse: function() {
            setInterval(() => {
                document.getElementById('cpuLoad').innerText = `CPU: ${Math.floor(Math.random()*(20-5)+5)}%`;
                document.getElementById('ramLoad').innerText = `RAM: ${(Math.random()*(4.8-4.2)+4.2).toFixed(1)}GB`;
            }, 2000);
        }
    }
};

document.addEventListener('DOMContentLoaded', () => adminApp.init());
