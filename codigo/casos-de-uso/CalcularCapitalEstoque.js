/**
 * CASO DE USO: CalcularCapitalEstoque
 * Avalia o valor do estoque atual: capital imobilizado a preço de custo,
 * faturamento potencial a preço de venda e o lucro reprimido aguardando venda.
 */
export class CalcularCapitalEstoque {
    /**
     * @param {import('../repositorios/RepositorioProdutos.js').RepositorioProdutos} repositorioProdutos
     */
    constructor(repositorioProdutos) {
        this.repositorioProdutos = repositorioProdutos;
    }

    async executar() {
        const produtos = await this.repositorioProdutos.obterTodosComLotes();

        let capitalImobilizadoCusto = 0;
        let faturamentoPotencialTabela = 0;
        let totalUnidadesFisicas = 0;

        produtos.forEach(prod => {
            const unidadesDisponiveis = prod.obterEstoqueTotal();
            totalUnidadesFisicas += unidadesDisponiveis;

            // Faturamento que entrará se vender tudo pelo preço de venda do catálogo
            faturamentoPotencialTabela += (unidadesDisponiveis * prod.precoVenda);

            // Capital preso baseado no custo real dos lotes que ainda têm saldo
            prod.lotes.forEach(lote => {
                if (!lote.estaEsgotado()) {
                    capitalImobilizadoCusto += (lote.quantidadeAtual * lote.precoCustoUnitario);
                }
            });
        });

        // Lucro que já está garantido no estoque, dependendo apenas das pessoas comprarem
        const lucroRepresadoEstoque = faturamentoPotencialTabela - capitalImobilizadoCusto;

        let margemPotencialPercentual = 0;
        if (faturamentoPotencialTabela > 0) {
            margemPotencialPercentual = Number(((lucroRepresadoEstoque / faturamentoPotencialTabela) * 100).toFixed(1));
        }

        return {
            totalUnidadesFisicas: totalUnidadesFisicas,
            capitalImobilizadoCusto: Number(capitalImobilizadoCusto.toFixed(2)),
            faturamentoPotencialTabela: Number(faturamentoPotencialTabela.toFixed(2)),
            lucroRepresadoEstoque: Number(lucroRepresadoEstoque.toFixed(2)),
            margemPotencialPercentual: margemPotencialPercentual
        };
    }
}
