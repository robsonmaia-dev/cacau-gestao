// Repositórios
import { RepositorioProdutos } from './repositorios/RepositorioProdutos.js';
import { RepositorioClientes } from './repositorios/RepositorioClientes.js';
import { RepositorioVendas } from './repositorios/RepositorioVendas.js';
import { RepositorioPerdas } from './repositorios/RepositorioPerdas.js';

// Casos de Uso Operacionais
import { ComprarEstoque } from './casos-de-uso/ComprarEstoque.js';
import { RegistrarVenda } from './casos-de-uso/RegistrarVenda.js';
import { GerarCobrancaMensal } from './casos-de-uso/GerarCobrancaMensal.js';
import { RegistrarPagamento } from './casos-de-uso/RegistrarPagamento.js';
import { RegistrarPerda } from './casos-de-uso/RegistrarPerda.js';
import { ObterBalancoFinanceiro } from './casos-de-uso/ObterBalancoFinanceiro.js';

// Casos de Uso de Inteligência & Gestão Estratégica
import { CalcularPontoEquilibrio } from './casos-de-uso/CalcularPontoEquilibrio.js';
import { CalcularCapitalEstoque } from './casos-de-uso/CalcularCapitalEstoque.js';
import { ObterDesempenhoProdutos } from './casos-de-uso/ObterDesempenhoProdutos.js';
import { CalcularPrevisaoReposicao } from './casos-de-uso/CalcularPrevisaoReposicao.js';
import { ObterPerfilClientes } from './casos-de-uso/ObterPerfilClientes.js';

// Controladores da Interface
import { ControladorEstoque } from './apresentacao/controladores/ControladorEstoque.js';
import { ControladorVendas } from './apresentacao/controladores/ControladorVendas.js';
import { ControladorClientes } from './apresentacao/controladores/ControladorClientes.js';
import { ControladorCobranca } from './apresentacao/controladores/ControladorCobranca.js';
import { ControladorRelatorios } from './apresentacao/controladores/ControladorRelatorios.js';
import { ControladorGestao } from './apresentacao/controladores/ControladorGestao.js';

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

async function iniciarAplicacao() {
    console.log("🍫 Inicializando Cacau Gestão...");

    try {
        // 1. Instancia Repositórios (Nuvem PostgreSQL)
        const repoProdutos = new RepositorioProdutos();
        const repoClientes = new RepositorioClientes();
        const repoVendas = new RepositorioVendas();
        const repoPerdas = new RepositorioPerdas();

        // 2. Instancia Casos de Uso Operacionais
        const ucComprarEstoque = new ComprarEstoque(repoProdutos);
        const ucRegistrarVenda = new RegistrarVenda(repoProdutos, repoClientes, repoVendas);
        const ucGerarCobranca = new GerarCobrancaMensal(repoVendas);
        const ucRegistrarPagamento = new RegistrarPagamento(repoClientes);
        const ucRegistrarPerda = new RegistrarPerda(repoProdutos, repoPerdas);
        const ucBalanco = new ObterBalancoFinanceiro(repoVendas, repoPerdas, repoProdutos, repoClientes);

        // 3. Instancia Casos de Uso de Gestão Estratégica
        const ucPontoEquilibrio = new CalcularPontoEquilibrio(repoProdutos, repoVendas, repoClientes);
        const ucCapitalEstoque = new CalcularCapitalEstoque(repoProdutos);
        const ucDesempenho = new ObterDesempenhoProdutos(repoProdutos, repoVendas);
        const ucPrevisaoReposicao = new CalcularPrevisaoReposicao(repoProdutos, repoVendas);
        const ucPerfilClientes = new ObterPerfilClientes(repoClientes, repoVendas, repoPerdas);

        // 4. Instancia Controladores
        let ctrlVendas = null;
        let ctrlClientes = null;
        let ctrlCobranca = null;
        let ctrlRelatorios = null;
        let ctrlGestao = null;

        // Callback de Sincronização Geral: Atualiza todas as telas ativas ao mudar dados
        const atualizarTudo = async () => {
            await ctrlEstoque.atualizarTela();
            if (ctrlVendas) await ctrlVendas.atualizarTela();
            if (ctrlClientes) await ctrlClientes.atualizarTela();
            if (ctrlCobranca) await ctrlCobranca.atualizarTela();
            if (ctrlRelatorios) await ctrlRelatorios.atualizarTela();
            if (ctrlGestao) await ctrlGestao.atualizarTela();
        };

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

        // 5. Inicialização de cada tela
        await ctrlEstoque.inicializar();
        await ctrlVendas.inicializar();
        await ctrlClientes.inicializar();
        await ctrlCobranca.inicializar();
        await ctrlRelatorios.inicializar();
        await ctrlGestao.inicializar();

        // 6. Configura a alternância das 6 abas garantindo dados frescos da nuvem
        configurarNavegacaoAbas(async (idAba) => {
            if (idAba === 'aba-vendas') await ctrlVendas.atualizarTela();
            if (idAba === 'aba-estoque') await ctrlEstoque.atualizarTela();
            if (idAba === 'aba-clientes') await ctrlClientes.atualizarTela();
            if (idAba === 'aba-cobranca') await ctrlCobranca.atualizarTela();
            if (idAba === 'aba-relatorios') await ctrlRelatorios.atualizarTela();
            if (idAba === 'aba-gestao') await ctrlGestao.atualizarTela();
        });

        // 7. Indicador Visual de Conexão no Topo
        const indicador = document.getElementById('indicador-conexao');
        if (indicador) {
            indicador.innerText = '● Nuvem Conectada';
            indicador.style.color = 'var(--cor-sucesso)';
        }

        console.log(" Cacau Gestão: Todas as 6 abas carregadas e operacionais!");
    } catch (erro) {
        console.error("Erro na inicialização:", erro);
        const indicador = document.getElementById('indicador-conexao');
        if (indicador) {
            indicador.innerText = '● Falha';
            indicador.style.color = 'var(--cor-perigo)';
        }
    }
}

document.addEventListener('DOMContentLoaded', iniciarAplicacao);