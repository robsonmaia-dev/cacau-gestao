import { AutenticacaoServico } from './repositorios/AutenticacaoServico.js';

import { RepositorioProdutos } from './repositorios/RepositorioProdutos.js';
import { RepositorioClientes } from './repositorios/RepositorioClientes.js';
import { RepositorioVendas } from './repositorios/RepositorioVendas.js';
import { RepositorioPerdas } from './repositorios/RepositorioPerdas.js';

import { ComprarEstoque } from './casos-de-uso/ComprarEstoque.js';
import { RegistrarVenda } from './casos-de-uso/RegistrarVenda.js';
import { EstornarVenda } from './casos-de-uso/EstornarVenda.js';
import { GerarCobrancaMensal } from './casos-de-uso/GerarCobrancaMensal.js';
import { RegistrarPagamento } from './casos-de-uso/RegistrarPagamento.js';
import { RegistrarPerda } from './casos-de-uso/RegistrarPerda.js';
import { ObterBalancoFinanceiro } from './casos-de-uso/ObterBalancoFinanceiro.js';
import { CalcularPontoEquilibrio } from './casos-de-uso/CalcularPontoEquilibrio.js';
import { CalcularCapitalEstoque } from './casos-de-uso/CalcularCapitalEstoque.js';
import { ObterDesempenhoProdutos } from './casos-de-uso/ObterDesempenhoProdutos.js';
import { CalcularPrevisaoReposicao } from './casos-de-uso/CalcularPrevisaoReposicao.js';
import { ObterPerfilClientes } from './casos-de-uso/ObterPerfilClientes.js';

import { ControladorHome } from './apresentacao/controladores/ControladorHome.js';
import { ControladorEstoque } from './apresentacao/controladores/ControladorEstoque.js';
import { ControladorVendas } from './apresentacao/controladores/ControladorVendas.js';
import { ControladorHistoricoVendas } from './apresentacao/controladores/ControladorHistoricoVendas.js';
import { ControladorClientes } from './apresentacao/controladores/ControladorClientes.js';
import { ControladorCobranca } from './apresentacao/controladores/ControladorCobranca.js';
import { ControladorRelatorios } from './apresentacao/controladores/ControladorRelatorios.js';
import { ControladorGestao } from './apresentacao/controladores/ControladorGestao.js';
import { ControladorCatalogo } from './apresentacao/controladores/ControladorCatalogo.js';

async function purgarCacheDoNavegador() {
    try {
        if ('caches' in window) {
            const chaves = await caches.keys();
            await Promise.all(chaves.map(k => caches.delete(k)));
        }
        if ('serviceWorker' in navigator) {
            const workers = await navigator.serviceWorker.getRegistrations();
            for (const worker of workers) {
                await worker.unregister();
            }
        }
    } catch (e) {
        console.warn("Aviso ao limpar cache:", e);
    }
}

// Navegação global programática entre abas
function trocarAbaAtiva(idAbaAlvo) {
    document.querySelectorAll('.botao-aba').forEach(b => b.classList.remove('ativa'));
    document.querySelectorAll('.gaveta-item').forEach(b => b.classList.remove('ativa'));
    document.querySelectorAll('.secao-aba').forEach(s => s.classList.remove('ativa'));

    document.querySelectorAll(`[data-aba="${idAbaAlvo}"]`).forEach(el => el.classList.add('ativa'));
    const secao = document.getElementById(idAbaAlvo);
    if (secao) secao.classList.add('ativa');
}

function configurarNavegacaoHibrida(aoMudarAba) {
    const gaveta = document.getElementById('menu-gaveta-lateral');
    const overlay = document.getElementById('menu-gaveta-overlay');
    const btnHamburguerTopo = document.getElementById('btn-hamburguer-topo');
    const btnMenuRodape = document.getElementById('btn-menu-rodape');
    const btnFecharGaveta = document.getElementById('btn-fechar-gaveta');

    const abrirGaveta = () => {
        overlay.classList.add('visivel');
        gaveta.classList.add('aberta');
    };

    const fecharGaveta = () => {
        overlay.classList.remove('visivel');
        gaveta.classList.remove('aberta');
    };

    btnHamburguerTopo?.addEventListener('click', abrirGaveta);
    btnMenuRodape?.addEventListener('click', abrirGaveta);
    btnFecharGaveta?.addEventListener('click', fecharGaveta);
    overlay?.addEventListener('click', fecharGaveta);

    const botoesNavegacao = document.querySelectorAll('.botao-aba[data-aba], .gaveta-item[data-aba]');

    botoesNavegacao.forEach(botao => {
        botao.addEventListener('click', async () => {
            const idAbaAlvo = botao.getAttribute('data-aba');
            if (!idAbaAlvo) return;

            trocarAbaAtiva(idAbaAlvo);
            fecharGaveta();

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
        const ucEstornarVenda = new EstornarVenda(repoVendas, repoProdutos, repoClientes);
        const ucGerarCobranca = new GerarCobrancaMensal(repoVendas);
        const ucRegistrarPagamento = new RegistrarPagamento(repoClientes);
        const ucRegistrarPerda = new RegistrarPerda(repoProdutos, repoPerdas);
        const ucBalanco = new ObterBalancoFinanceiro(repoVendas, repoPerdas, repoProdutos, repoClientes);

        const ucPontoEquilibrio = new CalcularPontoEquilibrio(repoProdutos, repoVendas, repoClientes);
        const ucCapitalEstoque = new CalcularCapitalEstoque(repoProdutos);
        const ucDesempenho = new ObterDesempenhoProdutos(repoProdutos, repoVendas);
        const ucPrevisaoReposicao = new CalcularPrevisaoReposicao(repoProdutos, repoVendas);
        const ucPerfilClientes = new ObterPerfilClientes(repoClientes, repoVendas, repoPerdas);

        let ctrlHome = null;
        let ctrlVendas = null;
        let ctrlHistorico = null;
        let ctrlEstoque = null;
        let ctrlClientes = null;
        let ctrlCobranca = null;
        let ctrlRelatorios = null;
        let ctrlGestao = null;

        const navegarParaAba = async (idAba) => {
            trocarAbaAtiva(idAba);
            if (idAba === 'aba-home') await ctrlHome.atualizarTela();
            if (idAba === 'aba-vendas') await ctrlVendas.atualizarTela();
            if (idAba === 'aba-historico') await ctrlHistorico.atualizarTela();
            if (idAba === 'aba-estoque') await ctrlEstoque.atualizarTela();
            if (idAba === 'aba-clientes') await ctrlClientes.atualizarTela();
            if (idAba === 'aba-cobranca') await ctrlCobranca.atualizarTela();
            if (idAba === 'aba-relatorios') await ctrlRelatorios.atualizarTela();
            if (idAba === 'aba-gestao') await ctrlGestao.atualizarTela();
            if (idAba === 'aba-catalogo') await ctrlCatalogo.atualizarTela();
        };

        const atualizarTudo = async () => {
            if (ctrlHome) await ctrlHome.atualizarTela();
            if (ctrlEstoque) await ctrlEstoque.atualizarTela();
            if (ctrlVendas) await ctrlVendas.atualizarTela();
            if (ctrlHistorico) await ctrlHistorico.atualizarTela();
            if (ctrlClientes) await ctrlClientes.atualizarTela();
            if (ctrlCobranca) await ctrlCobranca.atualizarTela();
            if (ctrlRelatorios) await ctrlRelatorios.atualizarTela();
            if (ctrlGestao) await ctrlGestao.atualizarTela();
        };

        const ctrlCatalogo = new ControladorCatalogo(repoProdutos);
        await ctrlCatalogo.inicializar();

        ctrlHome = new ControladorHome(repoVendas, repoProdutos, repoClientes, navegarParaAba);
        ctrlEstoque = new ControladorEstoque(repoProdutos, ucComprarEstoque, atualizarTudo);
        ctrlVendas = new ControladorVendas(repoProdutos, repoClientes, ucRegistrarVenda, atualizarTudo);

        const aoCorrigirVenda = async (dadosRelancamento) => {
            await navegarParaAba('aba-vendas');
            ctrlVendas.carregarVendaParaCorrecao(dadosRelancamento);
        };

        ctrlHistorico = new ControladorHistoricoVendas(repoVendas, repoClientes, ucEstornarVenda, aoCorrigirVenda, atualizarTudo);
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

        await ctrlHome.inicializar();
        await ctrlEstoque.inicializar();
        await ctrlVendas.inicializar();
        await ctrlHistorico.inicializar();
        await ctrlClientes.inicializar();
        await ctrlCobranca.inicializar();
        await ctrlRelatorios.inicializar();
        await ctrlGestao.inicializar();

        configurarNavegacaoHibrida(async (idAba) => {
            await navegarParaAba(idAba);
        });

        document.getElementById('btn-sair-sistema')?.addEventListener('click', async () => {
            if (confirm("Deseja sair do sistema?")) {
                await purgarCacheDoNavegador();
                await AutenticacaoServico.sair();
            }
        });

    } catch (erro) {
        console.error("Erro ao carregar dados:", erro);
        alert(`Erro ao conectar aos dados: ${erro.message}`);
    }
}

async function verificarSeguranca() {
    const telaLogin = document.getElementById('tela-login-bloqueio');
    const appAutenticada = document.getElementById('aplicacao-autenticada');
    const formLogin = document.getElementById('form-login-seguro');
    const msgErro = document.getElementById('mensagem-erro-login');

    const usuario = await AutenticacaoServico.obterUsuarioAtual();

    if (!usuario) {
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
                await purgarCacheDoNavegador();
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
        telaLogin.style.display = 'none';
        appAutenticada.style.display = 'block';
        await inicializarSistemaCompleto();
    }
}

document.addEventListener('DOMContentLoaded', verificarSeguranca);
