/**
 * CASO DE USO: ObterDesempenhoProdutos
 * Gera a curva de vendas: Mais Vendidos (volume), Mais Lucrativos (R$) e Encalhados (sem giro).
 */
export class ObterDesempenhoProdutos {
    /**
     * @param {import('../repositorios/RepositorioProdutos.js').RepositorioProdutos} repositorioProdutos
     * @param {import('../repositorios/RepositorioVendas.js').RepositorioVendas} repositorioVendas
     */
    constructor(repositorioProdutos, repositorioVendas) {
        this.repositorioProdutos = repositorioProdutos;
        this.repositorioVendas = repositorioVendas;
    }

    async executar() {
        const produtos = await this.repositorioProdutos.obterTodosComLotes();
        const vendas = await this.repositorioVendas.obterTodas();

        // 1. Mapeia dados de vendas por produto
        const mapaDesempenho = new Map();

        produtos.forEach(p => {
            mapaDesempenho.set(p.id, {
                id: p.id,
                nome: p.nome,
                categoria: p.categoria,
                precoVenda: p.precoVenda,
                estoqueAtual: p.obterEstoqueTotal(),
                custoMedio: p.calcularCustoMedioAtual(),
                quantidadeVendida: 0,
                faturamentoTotal: 0,
                lucroRealTotal: 0,
                dataUltimaVenda: null
            });
        });

        // 2. Acumula saídas a partir do histórico de vendas
        vendas.forEach(v => {
            v.itens.forEach(item => {
                if (mapaDesempenho.has(item.produtoId)) {
                    const dados = mapaDesempenho.get(item.produtoId);
                    dados.quantidadeVendida += item.quantidade;
                    dados.faturamentoTotal += (item.quantidade * item.precoVendaUnitario);
                    dados.lucroRealTotal += (item.quantidade * (item.precoVendaUnitario - item.custoUnitarioReal));

                    // Atualiza data da venda mais recente
                    const dataVenda = new Date(v.dataHora);
                    if (!dados.dataUltimaVenda || dataVenda > new Date(dados.dataUltimaVenda)) {
                        dados.dataUltimaVenda = v.dataHora;
                    }
                }
            });
        });

        const listaDesempenho = Array.from(mapaDesempenho.values());

        // 3. Ranking: Mais Vendidos por Volume
        const maisVendidosVolume = [...listaDesempenho]
            .filter(p => p.quantidadeVendida > 0)
            .sort((a, b) => b.quantidadeVendida - a.quantidadeVendida);

        // 4. Ranking: Mais Lucrativos em Reais (Quem põe mais dinheiro no bolso)
        const maisLucrativosValor = [...listaDesempenho]
            .filter(p => p.lucroRealTotal > 0)
            .sort((a, b) => b.lucroRealTotal - a.lucroRealTotal);

        // 5. Identificação de Produtos Encalhados (Têm estoque mas vendem pouco ou nada)
        const hoje = new Date();
        const produtosEncalhados = listaDesempenho
            .filter(p => p.estoqueAtual > 0)
            .map(p => {
                let diasSemVenda = Infinity;
                if (p.dataUltimaVenda) {
                    const diferencaMs = hoje - new Date(p.dataUltimaVenda);
                    diasSemVenda = Math.floor(diferencaMs / (1000 * 60 * 60 * 24));
                }
                return { ...p, diasSemVenda };
            })
            // Encalhado se nunca vendeu ou se está há mais de 5 dias parado na mesa
            .filter(p => p.quantidadeVendida === 0 || p.diasSemVenda >= 5)
            .sort((a, b) => b.diasSemVenda - a.diasSemVenda);

        return {
            maisVendidosVolume,
            maisLucrativosValor,
            produtosEncalhados
        };
    }
}