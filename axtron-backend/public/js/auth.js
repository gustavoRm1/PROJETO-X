// js/auth.js - Conectado à API Real
const Auth = {
    login: async function() {
        // 1. Pega os valores dos inputs do Modal no index.html
        const emailInput = document.querySelector('#loginModal input[type="email"]');
        const passInput = document.querySelector('#loginModal input[type="password"]');
        const btn = document.querySelector('#loginModal button');
        const msg = document.getElementById('loginMsg');

        if (!emailInput?.value || !passInput?.value) {
            if(msg) { msg.innerText = "Preencha todos os campos!"; msg.style.color = "#ff4444"; }
            return;
        }

        // Feedback visual (carregando)
        const originalText = btn.innerText;
        btn.innerText = "Verificando...";
        btn.disabled = true;

        try {
            // 2. Chama a API Real
            const response = await fetch('/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: emailInput.value,
                    password: passInput.value
                })
            });

            const data = await response.json();

            if (response.ok) {
                // 3. Sucesso: Salva o Token e o Usuário
                localStorage.setItem('axtron_token', data.token);
                localStorage.setItem('axtron_user', JSON.stringify(data.user));
                
                // Fecha modal e atualiza a tela
                if(app && app.ui) app.ui.closeLoginModal();
                window.location.reload(); 
            } else {
                // Erro (Senha errada ou usuário não existe)
                if(msg) { msg.innerText = data.error || "Credenciais inválidas."; msg.style.color = "#ff4444"; }
            }
        } catch (error) {
            console.error(error);
            if(msg) { msg.innerText = "Erro de conexão com o servidor."; msg.style.color = "#ff4444"; }
        } finally {
            btn.innerText = originalText;
            btn.disabled = false;
        }
    },

    logout: function() {
        localStorage.removeItem('axtron_token');
        localStorage.removeItem('axtron_user');
        window.location.href = 'index.html';
    }
};

// Torna global para ser chamado pelo HTML
window.login = Auth.login;
window.logout = Auth.logout;
