/**
 * CASO DE USO: CalcularPontoEquilibrio
 * Calcula o ponto de virada (Payback de Caixa) onde o dinheiro recebido
 * supera o montante total investido na compra dos estoques.
 */
export class CalcularPontoEquilibrio {
    /**
     * @param {import('../repositorios/RepositorioProdutos.js').RepositorioProdutos} repositorioProdutos
     * @param {import('../repositorios/RepositorioVendas.js').RepositorioVendas} repositorioVendas
     * @param {import('../repositorios/RepositorioClientes.js').RepositorioClientes} repositorioClientes
     */
    constructor(repositorioProdutos, repositorioVendas, repositorioClientes) {
        this.repositorioProdutos = repositorioProdutos;
        this.repositorioVendas = repositorioVendas;
        this.repositorioClientes = repositorioClientes;
    }

    async executar() {
        const produtos = await this.repositorioProdutos.obterTodosComLotes();
        const vendas = await this.repositorioVendas.obterTodas();
        const clientes = await this.repositorioClientes.obterTodosComHistorico();

        // 1. Total de dinheiro real gasto em compras de lotes (Saída de Caixa)
        let totalInvestidoEmCompras = 0;
        produtos.forEach(prod => {
            prod.lotes.forEach(lote => {
                totalInvestidoEmCompras += (lote.quantidadeInicial * lote.precoCustoUnitario);
            });
        });

        // 2. Total de dinheiro real efetivamente recebido (Entrada de Caixa)
        // A) Vendas pagas no Pix na hora
        let totalRecebidoPixNaHora = 0;
        vendas.forEach(venda => {
            if (!venda.ehFiado()) {
                totalRecebidoPixNaHora += venda.valorTotal;
            }
        });

        // B) Pix ou dinheiro recebido das amortizações de fiado
        let totalRecebidoAmortizacoes = 0;
        clientes.forEach(cliente => {
            (cliente.historicoPagamentos || []).forEach(pag => {
                totalRecebidoAmortizacoes += pag.valor;
            });
        });

        const totalRecebidoEmCaixa = totalRecebidoPixNaHora + totalRecebidoAmortizacoes;

        // 3. Cálculo do Ponto de Equilíbrio
        const saldoCaixaLivre = totalRecebidoEmCaixa - totalInvestidoEmCompras;
        const atingiuPontoEquilibrio = saldoCaixaLivre >= 0;

        // Porcentagem de retorno do investimento (0% a 100%+)
        let porcentagemRetorno = 0;
        if (totalInvestidoEmCompras > 0) {
            porcentagemRetorno = Number(((totalRecebidoEmCaixa / totalInvestidoEmCompras) * 100).toFixed(1));
        } else if (totalRecebidoEmCaixa > 0) {
            porcentagemRetorno = 100;
        }

        // Monta texto claro do status para o usuário
        let statusMensagem = "";
        let valorRestanteParaQuitar = 0;
        let lucroLivreNoBolso = 0;

        if (atingiuPontoEquilibrio) {
            lucroLivreNoBolso = Number(saldoCaixaLivre.toFixed(2));
            statusMensagem = `Investimento 100% pago! Você já está com R$ ${lucroLivreNoBolso.toFixed(2)} de lucro líquido livre no bolso.`;
        } else {
            valorRestanteParaQuitar = Number(Math.abs(saldoCaixaLivre).toFixed(2));
            statusMensagem = `Faltam R$ ${valorRestanteParaQuitar.toFixed(2)} em recebimentos para pagar 100% do investimento.`;
        }

        return {
            totalInvestidoEmCompras: Number(totalInvestidoEmCompras.toFixed(2)),
            totalRecebidoEmCaixa: Number(totalRecebidoEmCaixa.toFixed(2)),
            totalRecebidoPixNaHora: Number(totalRecebidoPixNaHora.toFixed(2)),
            totalRecebidoAmortizacoes: Number(totalRecebidoAmortizacoes.toFixed(2)),
            saldoCaixaLivre: Number(saldoCaixaLivre.toFixed(2)),
            atingiuPontoEquilibrio: atingiuPontoEquilibrio,
            porcentagemRetorno: porcentagemRetorno,
            valorRestanteParaQuitar: valorRestanteParaQuitar,
            lucroLivreNoBolso: lucroLivreNoBolso,
            statusMensagem: statusMensagem
        };
    }
}