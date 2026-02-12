function login(){
  const email = document.querySelector('input[type="email"], input[placeholder*="Email"]')?.value || '';
  const pass = document.querySelector('input[type="password"]')?.value || '';
  if(!email || !pass){ alert('Preencha email e senha'); return; }
  localStorage.setItem('logged', 'true');
  localStorage.setItem('userEmail', email);
  window.location.href = 'index.html';
}
