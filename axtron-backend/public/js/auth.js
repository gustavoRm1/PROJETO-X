async function login() {
    const emailInput = document.querySelector('input[type="email"]');
    const passInput = document.querySelector('input[type="password"]');
    
    if(!emailInput?.value || !passInput?.value) {
        alert('Por favor, preencha todos os campos.');
        return;
    }

    try {
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
            localStorage.setItem('axtron_token', data.token);
            localStorage.setItem('axtron_user', JSON.stringify(data.user));
            window.location.href = 'index.html';
        } else {
            alert(data.error || 'Falha no login');
        }
    } catch (err) {
        console.error("Erro no login:", err);
        alert('Erro ao conectar ao servidor.');
    }
}
