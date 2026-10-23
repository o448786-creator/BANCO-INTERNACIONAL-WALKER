
"use strict";

/*
 * WALKER BANK — PROTÓTIPO DE DEMONSTRAÇÃO
 * Pix, saldo e recompensas não representam dinheiro real.
 * Não use este armazenamento para dados bancários verdadeiros.
 */

const STORAGE_KEY = "walkerBankDemo_v1";
const SESSION_KEY = "walkerBankSession_v1";

const $ = (id) => document.getElementById(id);

const formatarMoeda = (valor) =>
  Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });

function lerUsuarios() {
  try {
    const dados = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return dados && typeof dados === "object" && !Array.isArray(dados)
      ? dados
      : {};
  } catch {
    return {};
  }
}

function salvarUsuarios(usuarios) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(usuarios));
    return true;
  } catch {
    notificar("Erro ao salvar. Verifique o armazenamento do navegador.", true);
    return false;
  }
}

function usuarioAtual() {
  return sessionStorage.getItem(SESSION_KEY);
}

function obterConta(nome = usuarioAtual()) {
  if (!nome) return null;
  return lerUsuarios()[nome] || null;
}

function notificar(mensagem, erro = false) {
  const aviso = $("notice");

  if (!aviso) {
    window.alert(mensagem);
    return;
  }

  aviso.textContent = mensagem;
  aviso.classList.remove("hidden", "error");

  if (erro) aviso.classList.add("error");

  clearTimeout(notificar.timer);
  notificar.timer = setTimeout(() => {
    aviso.classList.add("hidden");
  }, 4000);
}

function mudarTela(tela) {
  $("login-container").classList.toggle("hidden", tela !== "login");
  $("register-container").classList.toggle("hidden", tela !== "cadastro");
  $("app").classList.toggle("hidden", tela !== "banco");
}

function validarNome(nome) {
  return /^[a-z0-9_-]{3,24}$/.test(nome);
}

function adicionarMovimentacao(conta, tipo, valor, descricao) {
  conta.transactions ??= [];

  conta.transactions.unshift({
    id: Date.now() + "-" + Math.random().toString(36).slice(2, 7),
    type: tipo,
    amount: Math.round(valor * 100) / 100,
    description: descricao,
    date: new Date().toISOString()
  });

  conta.transactions = conta.transactions.slice(0, 100);
}

function atualizarConta(nome, operacao) {
  const usuarios = lerUsuarios();
  const conta = usuarios[nome];

  if (!conta) {
    notificar("Conta não encontrada.", true);
    sair();
    return false;
  }

  operacao(conta);

  if (!salvarUsuarios(usuarios)) return false;

  renderizarPainel();
  return true;
}

function lerValor(id) {
  const campo = $(id);
  const valor = Number(campo.value);

  if (!Number.isFinite(valor) || valor <= 0 || valor > 100000) {
    notificar("Informe um valor entre R$ 0,01 e R$ 100.000,00.", true);
    return null;
  }

  return Math.round(valor * 100) / 100;
}

// CADASTRO

$("show-register").addEventListener("click", () => mudarTela("cadastro"));
$("show-login").addEventListener("click", () => mudarTela("login"));

$("register-form").addEventListener("submit", (evento) => {
  evento.preventDefault();

  const nome = $("register-user").value.trim().toLowerCase();
  const senha = $("register-pass").value;

  if (!validarNome(nome)) {
    notificar("Use de 3 a 24 caracteres: letras, números, _ ou -.", true);
    return;
  }

  if (senha.length < 4 || senha.length > 128) {
    notificar("A senha de demonstração deve ter de 4 a 128 caracteres.", true);
    return;
  }

  const usuarios = lerUsuarios();

  if (usuarios[nome]) {
    notificar("Esse usuário já existe.", true);
    return;
  }

  usuarios[nome] = {
    username: nome,
    password: senha,
    balance: 0,
    rewards: 0,
    completedMissions: [],
    transactions: [],
    accountId: "WB-" + Math.random().toString(36).slice(2, 10).toUpperCase(),
    pixKey: nome + "@walker.demo"
  };

  if (!salvarUsuarios(usuarios)) return;

  $("register-form").reset();
  $("login-user").value = nome;

  mudarTela("login");
  notificar("Conta de demonstração criada! Faça seu login.");
});

// LOGIN

$("login-form").addEventListener("submit", (evento) => {
  evento.preventDefault();

  const nome = $("login-user").value.trim().toLowerCase();
  const senha = $("login-pass").value;
  const conta = obterConta(nome);

  if (!conta || conta.password !== senha) {
    notificar("Usuário ou senha incorretos.", true);
    return;
  }

  sessionStorage.setItem(SESSION_KEY, nome);
  $("login-form").reset();

  mudarTela("banco");
  navegar("inicio");
  renderizarPainel();

  notificar("Bem-vindo ao WALKER BANK de demonstração.");
});

// NAVEGAÇÃO

const paginas = {
  inicio: "Visão geral",
  pix: "Pix Walker",
  missoes: "Missões Walker",
  operacoes: "Operações bancárias",
  extrato: "Extrato",
  perfil: "Minha conta"
};

function navegar(pagina) {
  if (!Object.hasOwn(paginas, pagina)) return;

  document.querySelectorAll(".page").forEach((elemento) => {
    elemento.classList.toggle(
      "hidden",
      elemento.id !== "page-" + pagina
    );
  });

  document.querySelectorAll(".nav-btn").forEach((botao) => {
    botao.classList.toggle("active", botao.dataset.page === pagina);
  });

  $("page-title").textContent = paginas[pagina];

  if (pagina === "inicio" || pagina === "extrato") {
    renderizarExtrato();
  }

  if (pagina === "missoes") {
    renderizarMissoes();
  }
}

document.querySelectorAll("[data-page]").forEach((botao) => {
  botao.addEventListener("click", () => navegar(botao.dataset.page));
});

document.querySelectorAll("[data-go]").forEach((botao) => {
  botao.addEventListener("click", () => navegar(botao.dataset.go));
});

// PAINEL E SALDO

let saldoVisivel = true;

$("toggle-balance").addEventListener("click", () => {
  saldoVisivel = !saldoVisivel;
  renderizarPainel();
});

function renderizarPainel() {
  const conta = obterConta();

  if (!conta) {
    sair();
    return;
  }

  $("header-user").textContent = conta.username;
  $("welcome-user").textContent = conta.username;
  $("profile-user").textContent = conta.username;

  $("account-id").textContent = conta.accountId;
  $("my-pix-key").textContent = conta.pixKey;
  $("profile-pix").textContent = conta.pixKey;

  $("balance").textContent = saldoVisivel
    ? formatarMoeda(conta.balance)
    : "••••••";

  $("toggle-balance").textContent = saldoVisivel ? "◉" : "◎";

  $("reward-total").textContent = formatarMoeda(conta.rewards);
  $("mission-count").textContent = conta.completedMissions.length;

  renderizarExtrato();
  renderizarMissoes();
}

// DEPÓSITO SIMULADO

$("deposit-form").addEventListener("submit", (evento) => {
  evento.preventDefault();

  const valor = lerValor("deposit-value");
  if (valor === null) return;

  const sucesso = atualizarConta(usuarioAtual(), (conta) => {
    conta.balance = Math.round((conta.balance + valor) * 100) / 100;

    adicionarMovimentacao(
      conta,
      "Depósito simulado",
      valor,
      "Crédito fictício"
    );
  });

  if (sucesso) {
    $("deposit-form").reset();
    notificar("Depósito de demonstração registrado.");
  }
});

// SAQUE SIMULADO

$("withdraw-form").addEventListener("submit", (evento) => {
  evento.preventDefault();

  const valor = lerValor("withdraw-value");
  if (valor === null) return;

  const conta = obterConta();

  if (!conta || valor > conta.balance) {
    notificar("Saldo fictício insuficiente.", true);
    return;
  }

  const sucesso = atualizarConta(usuarioAtual(), (dados) => {
    dados.balance = Math.round((dados.balance - valor) * 100) / 100;

    adicionarMovimentacao(
      dados,
      "Saque simulado",
      -valor,
      "Retirada fictícia"
    );
  });

  if (sucesso) {
    $("withdraw-form").reset();
    notificar("Saque de demonstração registrado.");
  }
});

// PIX SIMULADO

$("pix-form").addEventListener("submit", (evento) => {
  evento.preventDefault();

  const chave = $("pix-key").value.trim();
  const valor = lerValor("pix-value");
  const descricao = $("pix-description").value.trim();

  if (!chave || chave.length > 100 || valor === null) {
    notificar("Confira os dados da transferência de teste.", true);
    return;
  }

  const conta = obterConta();

  if (!conta || valor > conta.balance) {
    notificar("Saldo fictício insuficiente.", true);
    return;
  }

  if (!confirm(
    "PIX WALKER — DEMONSTRAÇÃO\n\n" +
    "Destinatário: " + chave + "\n" +
    "Valor: " + formatarMoeda(valor) + "\n\n" +
    "Nenhum dinheiro real será transferido.\nDeseja continuar?"
  )) {
    return;
  }

  const sucesso = atualizarConta(usuarioAtual(), (dados) => {
    dados.balance = Math.round((dados.balance - valor) * 100) / 100;

    adicionarMovimentacao(
      dados,
      "Pix simulado enviado",
      -valor,
      descricao || "Destinatário de teste: " + chave
    );
  });

  if (sucesso) {
    $("pix-form").reset();
    notificar("Simulação concluída. Nenhum Pix real foi enviado.");
  }
});

// COPIAR CHAVE PIX DE TESTE

$("copy-pix").addEventListener("click", async () => {
  const conta = obterConta();
  if (!conta) return;

  try {
    await navigator.clipboard.writeText(conta.pixKey);
    notificar("Chave Pix de teste copiada.");
  } catch {
    notificar("Copie manualmente esta chave: " + conta.pixKey);
  }
});

// MISSÕES WALKER

const missoes = [
  {
    id: "welcome",
    icon: "✦",
    title: "Primeiro acesso",
    description: "Comece sua jornada no universo Walker.",
    reward: 10,
    page: "inicio"
  },
  {
    id: "pix-training",
    icon: "⇄",
    title: "Explorador Pix",
    description: "Conheça a interface Pix de demonstração.",
    reward: 15,
    page: "pix"
  },
  {
    id: "account-training",
    icon: "◈",
    title: "Guardião da conta",
    description: "Consulte os dados da sua conta de teste.",
    reward: 20,
    page: "perfil"
  },
  {
    id: "history-training",
    icon: "▤",
    title: "Analista Walker",
    description: "Explore seu extrato de demonstração.",
    reward: 15,
    page: "extrato"
  },
  {
    id: "operations-training",
    icon: "＋",
    title: "Operador Templário",
    description: "Conheça as operações do sistema.",
    reward: 20,
    page: "operacoes"
  }
];

function renderizarMissoes() {
  const conta = obterConta();
  const lista = $("mission-list");

  if (!conta || !lista) return;

  lista.replaceChildren();

  missoes.forEach((missao) => {
    const concluida = conta.completedMissions.includes(missao.id);
    const cartao = document.createElement("article");
    cartao.className = "card mission-card" +
      (concluida ? " completed" : "");

    const icone = document.createElement("div");
    icone.className = "mission-icon";
    icone.textContent = missao.icon;

    const titulo = document.createElement("h3");
    titulo.textContent = missao.title;

    const descricao = document.createElement("p");
    descricao.textContent = missao.description;

    const recompensa = document.createElement("div");
    recompensa.className = "reward";
    recompensa.textContent =
      "+" + formatarMoeda(missao.reward) + " virtuais";

    const botao = document.createElement("button");
    botao.className = "btn " + (concluida ? "secondary" : "primary");
    botao.textContent = concluida
      ? "Missão concluída ✓"
      : "Concluir missão";
    botao.disabled = concluida;

    botao.addEventListener("click", () => {
      if (missao.id !== "welcome") {
        const pagina = $("page-" + missao.page);

        if (!pagina || pagina.classList.contains("hidden")) {
          notificar(
            "Visite primeiro a seção indicada para esta missão.",
            true
          );
          return;
        }
      }

      const atual = obterConta();

      if (!atual || atual.completedMissions.includes(missao.id)) {
        return;
      }

      const sucesso = atualizarConta(usuarioAtual(), (dados) => {
        dados.completedMissions.push(missao.id);

        dados.rewards =
          Math.round((dados.rewards + missao.reward) * 100) / 100;

        dados.balance =
          Math.round((dados.balance + missao.reward) * 100) / 100;

        adicionarMovimentacao(
          dados,
          "Recompensa virtual",
          missao.reward,
          "Missão: " + missao.title
        );
      });

      if (sucesso) {
        notificar(
          "Missão concluída! Créditos fictícios adicionados à conta."
        );
      }
    });

    cartao.append(icone, titulo, descricao, recompensa, botao);
    lista.append(cartao);
  });
}

// EXTRATO E HISTÓRICO

function renderizarExtrato() {
  const conta = obterConta();
  if (!conta) return;

  const transacoes = conta.transactions || [];

  function desenharLista(elemento, itens) {
    elemento.replaceChildren();

    if (itens.length === 0) {
      elemento.className = "empty-state";
      elemento.textContent = "Nenhuma movimentação registrada.";
      return;
    }

    elemento.className = "transaction-list";

    itens.forEach((item) => {
      const linha = document.createElement("div");
      linha.className = "transaction";

      const detalhes = document.createElement("div");

      const titulo = document.createElement("strong");
      titulo.textContent = item.type;

      const data = document.createElement("small");
      const instante = new Date(item.date);

      data.textContent =
        (Number.isNaN(instante.getTime())
          ? "Data indisponível"
          : instante.toLocaleString("pt-BR")) +
        " • " + item.description;

      detalhes.append(titulo, data);

      const valor = document.createElement("div");
      valor.className = "amount " +
        (item.amount >= 0 ? "positive" : "negative");

      valor.textContent =
        (item.amount >= 0 ? "+" : "−") +
        formatarMoeda(Math.abs(item.amount));

      linha.append(detalhes, valor);
      elemento.append(linha);
    });
  }

  desenharLista($("recent-list"), transacoes.slice(0, 5));
  desenharLista($("statement-list"), transacoes);
}

$("clear-history").addEventListener("click", () => {
  if (!confirm("Apagar o histórico desta conta de demonstração?")) {
    return;
  }

  const sucesso = atualizarConta(usuarioAtual(), (conta) => {
    conta.transactions = [];
  });

  if (sucesso) notificar("Histórico de demonstração apagado.");
});

// SAIR

$("logout").addEventListener("click", sair);

function sair() {
  sessionStorage.removeItem(SESSION_KEY);
  mudarTela("login");
}

// INICIALIZAÇÃO

if (usuarioAtual() && obterConta()) {
  mudarTela("banco");
  navegar("inicio");
  renderizarPainel();
} else {
  sessionStorage.removeItem(SESSION_KEY);
  mudarTela("login");
}
