import { TelaHome } from '../telas/TelaHome.js';

export class ControladorHome {
    constructor(repositorioVendas, repositorioProdutos, repositorioClientes, navegarParaAba) {
        this.repositorioVendas = repositorioVendas;
        this.repositorioProdutos = repositorioProdutos;
        this.repositorioClientes = repositorioClientes;
        this.navegarParaAba = navegarParaAba;
        this.container = document.getElementById('conteudo-home');
    }

    async inicializar() {
        await this.atualizarTela();
    }

    async atualizarTela() {
        if (!this.container) return;

        try {
            const vendas = await this.repositorioVendas.obterTodas();
            const produtos = await this.repositorioProdutos.obterTodosComLotes();
            const clientes = await this.repositorioClientes.obterTodosComHistorico();

            // 1. Pix recebido hoje
            const hojeISO = new Date().toISOString().split('T')[0];
            const pixHoje = vendas
                .filter(v => (v.dataHora || '').startsWith(hojeISO) && v.tipoPagamento === 'PIX_IMEDIATO')
                .reduce((soma, v) => soma + Number(v.valorTotal), 0);

            // 2. Fiado pendente total
            const totalFiado = clientes.reduce((soma, c) => soma + Number(c.saldoDevedor || 0), 0);

            // 3. Status de estoque
            let totalItensEstoque = 0;
            let itensReposicao = 0;
            let lotesVencendo = 0;

            produtos.forEach(p => {
                const est = p.obterEstoqueTotal();
                totalItensEstoque += est;
                if (p.precisaDeReposicao()) itensReposicao++;

                p.lotes.forEach(l => {
                    if (!l.estaEsgotado() && l.estaProximoDoVencimento(15)) {
                        lotesVencendo++;
                    }
                });
            });

            // 4. Top 3 produtos mais vendidos
            const mapaVendas = new Map();
            vendas.forEach(v => {
                v.itens.forEach(it => {
                    const atual = mapaVendas.get(it.produtoId) || { nome: it.nomeProduto, quantidade: 0, faturamento: 0 };
                    atual.quantidade += it.quantidade;
                    atual.faturamento += it.quantidade * it.precoVendaUnitario;
                    mapaVendas.set(it.produtoId, atual);
                });
            });

            const topProdutos = Array.from(mapaVendas.values())
                .sort((a, b) => b.quantidade - a.quantidade)
                .slice(0, 3);

            TelaHome.renderizar(this.container, {
                pixHoje,
                totalFiado,
                totalItensEstoque,
                itensReposicao,
                lotesVencendo,
                topProdutos
            });

            this.vincularEventos();
        } catch (erro) {
            console.error("Erro ao carregar Home:", erro);
            this.container.innerHTML = `<p style="color: var(--cor-perigo); text-align: center;">Erro: ${erro.message}</p>`;
        }
    }

    vincularEventos() {
        // Vincula todos os botões de atalho da Home
        document.querySelectorAll('[data-ir-aba]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const abaAlvo = btn.getAttribute('data-ir-aba');
                if (abaAlvo && this.navegarParaAba) {
                    this.navegarParaAba(abaAlvo);
                }
            });
        });
    }
}
