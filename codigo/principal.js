import { RepositorioProdutos } from './repositorios/RepositorioProdutos.js';
import { RepositorioClientes } from './repositorios/RepositorioClientes.js';
import { RepositorioVendas } from './repositorios/RepositorioVendas.js';

import { ComprarEstoque } from './casos-de-uso/ComprarEstoque.js';
import { RegistrarVenda } from './casos-de-uso/RegistrarVenda.js';
import { GerarCobrancaMensal } from './casos-de-uso/GerarCobrancaMensal.js';
import { RegistrarPagamento } from './casos-de-uso/RegistrarPagamento.js';

import { ControladorEstoque } from './apresentacao/controladores/ControladorEstoque.js';
import { ControladorVendas } from './apresentacao/controladores/ControladorVendas.js';
import { ControladorCobranca } from './apresentacao/controladores/ControladorCobranca.js';

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
        // Repositórios
        const repoProdutos = new RepositorioProdutos();
        const repoClientes = new RepositorioClientes();
        const repoVendas = new RepositorioVendas();

        // Casos de Uso
        const ucComprarEstoque = new ComprarEstoque(repoProdutos);
        const ucRegistrarVenda = new RegistrarVenda(repoProdutos, repoClientes, repoVendas);
        const ucGerarCobranca = new GerarCobrancaMensal(repoVendas);
        const ucRegistrarPagamento = new RegistrarPagamento(repoClientes);

        // Controladores
        const ctrlEstoque = new ControladorEstoque(repoProdutos, ucComprarEstoque);
        
        let ctrlCobranca = null;
        const atualizarTudo = async () => {
            await ctrlEstoque.atualizarTela();
            if (ctrlCobranca) await ctrlCobranca.atualizarTela();
        };

        const ctrlVendas = new ControladorVendas(repoProdutos, repoClientes, ucRegistrarVenda, atualizarTudo);
        ctrlCobranca = new ControladorCobranca(repoClientes, ucGerarCobranca, ucRegistrarPagamento, atualizarTudo);

        // Inicializa telas
        await ctrlEstoque.inicializar();
        await ctrlVendas.inicializar();
        await ctrlCobranca.inicializar();

        // Recarrega dados ao alternar de aba
        configurarNavegacaoAbas(async (idAba) => {
            if (idAba === 'aba-vendas') await ctrlVendas.atualizarTela();
            if (idAba === 'aba-estoque') await ctrlEstoque.atualizarTela();
            if (idAba === 'aba-cobranca') await ctrlCobranca.atualizarTela();
        });

        const indicador = document.getElementById('indicador-conexao');
        if (indicador) {
            indicador.innerText = '● Nuvem Conectada';
            indicador.style.color = 'var(--cor-sucesso)';
        }
    } catch (erro) {
        console.error("Erro na inicialização:", erro);
    }
}

document.addEventListener('DOMContentLoaded', iniciarAplicacao);