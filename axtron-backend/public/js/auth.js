async function login() {
    const email = document.querySelector('input[type="email"], input[placeholder*="Email"]')?.value || '';
    const pass = document.querySelector('input[type="password"]')?.value || '';
    
    if (!email || !pass) { 
        alert('Preencha email e senha'); 
        return; 
    }

    try {
        const response = await fetch('/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: pass })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('axtron_user', JSON.stringify(data.user));
            localStorage.setItem('axtron_token', data.token);
            window.location.href = 'index.html';
        } else {
            alert(data.error || 'Erro ao entrar. Verifique suas credenciais.');
        }
    } catch (error) {
        alert('Erro ao conectar com o servidor.');
    }
}
