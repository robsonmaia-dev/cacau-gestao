import { AutenticacaoServico } from './repositorios/AutenticacaoServico.js';

// Repositórios
import { RepositorioProdutos } from './repositorios/RepositorioProdutos.js';
import { RepositorioClientes } from './repositorios/RepositorioClientes.js';
import { RepositorioVendas } from './repositorios/RepositorioVendas.js';
import { RepositorioPerdas } from './repositorios/RepositorioPerdas.js';

// Casos de Uso
import { ComprarEstoque } from './casos-de-uso/ComprarEstoque.js';
import { RegistrarVenda } from './casos-de-uso/RegistrarVenda.js';
import { GerarCobrancaMensal } from './casos-de-uso/GerarCobrancaMensal.js';
import { RegistrarPagamento } from './casos-de-uso/RegistrarPagamento.js';
import { RegistrarPerda } from './casos-de-uso/RegistrarPerda.js';
import { ObterBalancoFinanceiro } from './casos-de-uso/ObterBalancoFinanceiro.js';
import { CalcularPontoEquilibrio } from './casos-de-uso/CalcularPontoEquilibrio.js';
import { CalcularCapitalEstoque } from './casos-de-uso/CalcularCapitalEstoque.js';
import { ObterDesempenhoProdutos } from './casos-de-uso/ObterDesempenhoProdutos.js';
import { CalcularPrevisaoReposicao } from './casos-de-uso/CalcularPrevisaoReposicao.js';
import { ObterPerfilClientes } from './casos-de-uso/ObterPerfilClientes.js';

// Controladores
import { ControladorEstoque } from './apresentacao/controladores/ControladorEstoque.js';
import { ControladorVendas } from './apresentacao/controladores/ControladorVendas.js';
import { ControladorClientes } from './apresentacao/controladores/ControladorClientes.js';
import { ControladorCobranca } from './apresentacao/controladores/ControladorCobranca.js';
import { ControladorRelatorios } from './apresentacao/controladores/ControladorRelatorios.js';
import { ControladorGestao } from './apresentacao/controladores/ControladorGestao.js';
import { ControladorCatalogo } from './apresentacao/controladores/ControladorCatalogo.js';

function configurarNavegacaoAbas(aoMudarAba) {
    const botoesNavegacao = document.querySelectorAll('.botao-aba');
    const secoesAba = document.querySelectorAll('.secao-aba');

    botoesNavegacao.forEach(botao => {
        botao.addEventListener('click', async () => {
            const idAbaAlvo = botao.getAttribute('data-aba');
            botoesNavegacao.forEach(b => b.classList.remove('ativa'));
            secoesAba.forEach(s => s.classList.remove('ativa'));

            botao.classList.add('ativa');
            const secaoAlvo = document.getElementById(idAbaAlvo);
            if (secaoAlvo) secaoAlvo.classList.add('ativa');

            if (aoMudarAba) await aoMudarAba(idAbaAlvo);
        });
    });
}

async function inicializarSistemaCompleto() {
    console.log("🍫 Usuário autenticado! Inicializando Cacau Gestão...");

    try {
        const repoProdutos = new RepositorioProdutos();
        const repoClientes = new RepositorioClientes();
        const repoVendas = new RepositorioVendas();
        const repoPerdas = new RepositorioPerdas();

        const ucComprarEstoque = new ComprarEstoque(repoProdutos);
        const ucRegistrarVenda = new RegistrarVenda(repoProdutos, repoClientes, repoVendas);
        const ucGerarCobranca = new GerarCobrancaMensal(repoVendas);
        const ucRegistrarPagamento = new RegistrarPagamento(repoClientes);
        const ucRegistrarPerda = new RegistrarPerda(repoProdutos, repoPerdas);
        const ucBalanco = new ObterBalancoFinanceiro(repoVendas, repoPerdas, repoProdutos, repoClientes);

        const ucPontoEquilibrio = new CalcularPontoEquilibrio(repoProdutos, repoVendas, repoClientes);
        const ucCapitalEstoque = new CalcularCapitalEstoque(repoProdutos);
        const ucDesempenho = new ObterDesempenhoProdutos(repoProdutos, repoVendas);
        const ucPrevisaoReposicao = new CalcularPrevisaoReposicao(repoProdutos, repoVendas);
        const ucPerfilClientes = new ObterPerfilClientes(repoClientes, repoVendas, repoPerdas);

        let ctrlVendas = null;
        let ctrlClientes = null;
        let ctrlCobranca = null;
        let ctrlRelatorios = null;
        let ctrlGestao = null;

        const atualizarTudo = async () => {
            await ctrlEstoque.atualizarTela();
            if (ctrlVendas) await ctrlVendas.atualizarTela();
            if (ctrlClientes) await ctrlClientes.atualizarTela();
            if (ctrlCobranca) await ctrlCobranca.atualizarTela();
            if (ctrlRelatorios) await ctrlRelatorios.atualizarTela();
            if (ctrlGestao) await ctrlGestao.atualizarTela();
        };

        const ctrlCatalogo = new ControladorCatalogo(repoProdutos);
        await ctrlCatalogo.inicializar();

        const ctrlEstoque = new ControladorEstoque(repoProdutos, ucComprarEstoque, atualizarTudo);
        ctrlVendas = new ControladorVendas(repoProdutos, repoClientes, ucRegistrarVenda, atualizarTudo);
        ctrlClientes = new ControladorClientes(repoClientes, atualizarTudo);
        ctrlCobranca = new ControladorCobranca(repoClientes, ucGerarCobranca, ucRegistrarPagamento, atualizarTudo);
        ctrlRelatorios = new ControladorRelatorios(ucBalanco, ucRegistrarPerda, repoProdutos, atualizarTudo);
        ctrlGestao = new ControladorGestao(
            ucPontoEquilibrio,
            ucCapitalEstoque,
            ucDesempenho,
            ucPrevisaoReposicao,
            ucPerfilClientes
        );

        await ctrlEstoque.inicializar();
        await ctrlVendas.inicializar();
        await ctrlClientes.inicializar();
        await ctrlCobranca.inicializar();
        await ctrlRelatorios.inicializar();
        await ctrlGestao.inicializar();

        configurarNavegacaoAbas(async (idAba) => {
            if (idAba === 'aba-vendas') await ctrlVendas.atualizarTela();
            if (idAba === 'aba-estoque') await ctrlEstoque.atualizarTela();
            if (idAba === 'aba-clientes') await ctrlClientes.atualizarTela();
            if (idAba === 'aba-cobranca') await ctrlCobranca.atualizarTela();
            if (idAba === 'aba-relatorios') await ctrlRelatorios.atualizarTela();
            if (idAba === 'aba-gestao') await ctrlGestao.atualizarTela();
            if (idAba === 'aba-catalogo') await ctrlCatalogo.atualizarTela();
        });

        // Botão de Logout Seguro
        document.getElementById('btn-sair-sistema')?.addEventListener('click', async () => {
            if (confirm("Deseja sair do sistema?")) {
                await AutenticacaoServico.sair();
            }
        });

    } catch (erro) {
        console.error("Erro ao carregar dados:", erro);
        alert(`Erro ao conectar aos dados protegidos: ${erro.message}`);
    }
}

// GUARDA DE SEGURANÇA (Verifica se está logado antes de carregar o app)
async function verificarSeguranca() {
    const telaLogin = document.getElementById('tela-login-bloqueio');
    const appAutenticada = document.getElementById('aplicacao-autenticada');
    const formLogin = document.getElementById('form-login-seguro');
    const msgErro = document.getElementById('mensagem-erro-login');

    const usuario = await AutenticacaoServico.obterUsuarioAtual();

    if (!usuario) {
        // Bloqueado: Exibe a tela de login
        telaLogin.style.display = 'flex';
        appAutenticada.style.display = 'none';

        formLogin?.addEventListener('submit', async (e) => {
            e.preventDefault();
            msgErro.style.display = 'none';

            const email = document.getElementById('login-email').value;
            const senha = document.getElementById('login-senha').value;
            const btn = document.getElementById('btn-entrar-login');

            btn.disabled = true;
            btn.innerText = "Autenticando...";

            try {
                await AutenticacaoServico.entrar(email, senha);
                telaLogin.style.display = 'none';
                appAutenticada.style.display = 'block';
                await inicializarSistemaCompleto();
            } catch (err) {
                msgErro.innerText = "E-mail ou senha incorretos.";
                msgErro.style.display = 'block';
                btn.disabled = false;
                btn.innerText = "Entrar no Sistema";
            }
        });
    } else {
        // Usuário já autenticado: Entra direto!
        telaLogin.style.display = 'none';
        appAutenticada.style.display = 'block';
        await inicializarSistemaCompleto();
    }
}

document.addEventListener('DOMContentLoaded', verificarSeguranca);