// Variáveis para controlar telas
const loginDiv = document.getElementById('login-container');
const cadastroDiv = document.getElementById('cadastro-container');
const bancoDiv = document.getElementById('banco-container');

// Pega usuários do navegador ou inicia uma lista vazia
let usuarios = JSON.parse(localStorage.getItem('bancoUsuarios')) || [];
let usuarioLogadoIndex = null;

// Funções para mudar de tela
function mostrarCadastro() {
    loginDiv.classList.add('hidden');
    cadastroDiv.classList.remove('hidden');
}

function mostrarLogin() {
    cadastroDiv.classList.add('hidden');
    loginDiv.classList.remove('hidden');
}

// Lógica de Cadastro de Usuário
function cadastrarUsuario() {
    const user = document.getElementById('cad-user').value;
    const pass = document.getElementById('cad-pass').value;
    const saldo = parseFloat(document.getElementById('cad-saldo').value);

    if (user === '' || pass === '' || isNaN(saldo) || saldo < 0) {
        alert('Por favor, preencha todos os campos corretamente!');
        return;
    }

    // Verifica se usuário já existe
    const existe = usuarios.some(u => u.nome === user);
    if (existe) {
        alert('Este usuário já existe! Escolha outro.');
        return;
    }

    // Cria um objeto de usuário
    const novoUsuario = {
        nome: user,
        senha: pass,
        saldo: saldo
    };

    usuarios.push(novoUsuario);
    localStorage.setItem('bancoUsuarios', JSON.stringify(usuarios));
    alert('Conta criada com sucesso!');
    
    // Limpa campos e volta pro login
    document.getElementById('cad-user').value = '';
    document.getElementById('cad-pass').value = '';
    document.getElementById('cad-saldo').value = '';
    mostrarLogin();
}

// Lógica de Login
function fazerLogin() {
    const user = document.getElementById('login-user').value;
    const pass = document.getElementById('login-pass').value;

    // Busca o usuário na lista
    const index = usuarios.findIndex(u => u.nome === user && u.senha === pass);

    if (index !== -1) {
        usuarioLogadoIndex = index;
        document.getElementById('user-name').textContent = usuarios[index].nome;
        atualizarTelaSaldo();

        loginDiv.classList.add('hidden');
        bancoDiv.classList.remove('hidden');

        // Limpa campos
        document.getElementById('login-user').value = '';
        document.getElementById('login-pass').value = '';
    } else {
        alert('Usuário ou senha incorretos!');
    }
}

// Atualiza o saldo na tela
function atualizarTelaSaldo() {
    const saldoAtual = usuarios[usuarioLogadoIndex].saldo;
    document.getElementById('saldo-atual').textContent = saldoAtual.toFixed(2);
}

// Depósito
function depositar() {
    const valor = parseFloat(document.getElementById('valor-op').value);

    if (isNaN(valor) || valor <= 0) {
        alert('Digite um valor válido para depósito.');
        return;
    }

    usuarios[usuarioLogadoIndex].saldo += valor;
    salvarEAtualizar();
    document.getElementById('valor-op').value = '';
}

// Saque
function sacar() {
    const valor = parseFloat(document.getElementById('valor-op').value);

    if (isNaN(valor) || valor <= 0) {
        alert('Digite um valor válido para saque.');
        return;
    }

    if (valor > usuarios[usuarioLogadoIndex].saldo) {
        alert('Saldo insuficiente!');
        return;
    }

    usuarios[usuarioLogadoIndex].saldo -= valor;
    salvarEAtualizar();
    document.getElementById('valor-op').value = '';
}

// Salva no navegador e atualiza a interface
function salvarEAtualizar() {
    localStorage.setItem('bancoUsuarios', JSON.stringify(usuarios));
    atualizarTelaSaldo();
    alert('Operação realizada com sucesso!');
}

// Sair da conta
function sair() {
    usuarioLogadoIndex = null;
    bancoDiv.classList.add('hidden');
    loginDiv.classList.remove('hidden');
}
