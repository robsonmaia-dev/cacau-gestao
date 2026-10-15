/**
 * CASO DE USO: ObterBalancoFinanceiro
 * Consolida a DRE (Demonstração do Resultado) da sua revenda: Receitas, Custos, Perdas e Lucro Líquido Real.
 */
export class ObterBalancoFinanceiro {
    /**
     * @param {import('../repositorios/RepositorioVendas.js').RepositorioVendas} repositorioVendas
     * @param {import('../repositorios/RepositorioPerdas.js').RepositorioPerdas} repositorioPerdas
     * @param {import('../repositorios/RepositorioProdutos.js').RepositorioProdutos} repositorioProdutos
     * @param {import('../repositorios/RepositorioClientes.js').RepositorioClientes} repositorioClientes
     */
    constructor(repositorioVendas, repositorioPerdas, repositorioProdutos, repositorioClientes) {
        this.repositorioVendas = repositorioVendas;
        this.repositorioPerdas = repositorioPerdas;
        this.repositorioProdutos = repositorioProdutos;
        this.repositorioClientes = repositorioClientes;
    }

    async executar() {
        // 1. Busca os dados consolidados das quatro tabelas
        const vendas = await this.repositorioVendas.obterTodas();
        const perdas = await this.repositorioPerdas.obterTodas();
        const produtos = await this.repositorioProdutos.obterTodosComLotes();
        const clientes = await this.repositorioClientes.obterTodosComHistorico();

        // 2. Cálculos de Vendas
        let receitaBruta = 0;
        let custoMercadoriasVendidas = 0;
        let totalRecebidoPix = 0;
        let totalVendidoFiado = 0;

        vendas.forEach(v => {
            receitaBruta += v.valorTotal;
            custoMercadoriasVendidas += v.custoTotal;

            if (v.ehFiado()) {
                totalVendidoFiado += v.valorTotal;
            } else {
                totalRecebidoPix += v.valorTotal;
            }
        });

        const lucroBruto = receitaBruta - custoMercadoriasVendidas;

        // 3. Cálculos de Perdas Operacionais
        let prejuizoTotalPerdas = 0;
        const perdasPorMotivo = {
            VENCIMENTO: 0,
            AVARIA: 0,
            DESVIO: 0,
            CONSUMO_PROPRIO: 0
        };

        perdas.forEach(p => {
            prejuizoTotalPerdas += p.prejuizoTotal;
            if (perdasPorMotivo[p.motivo] !== undefined) {
                perdasPorMotivo[p.motivo] += p.prejuizoTotal;
            }
        });

        // 4. Lucro Líquido Real (O que sobra de verdade no bolso)
        const lucroLiquidoReal = lucroBruto - prejuizoTotalPerdas;

        // 5. Contas a Receber e Capital em Estoque Parado
        const totalAReceber = clientes.reduce((soma, c) => soma + c.saldoDevedor, 0);

        let capitalEstoqueParado = 0;
        produtos.forEach(p => {
            capitalEstoqueParado += (p.obterEstoqueTotal() * p.calcularCustoMedioAtual());
        });

        return {
            receitaBruta: Number(receitaBruta.toFixed(2)),
            custoMercadoriasVendidas: Number(custoMercadoriasVendidas.toFixed(2)),
            lucroBruto: Number(lucroBruto.toFixed(2)),
            prejuizoTotalPerdas: Number(prejuizoTotalPerdas.toFixed(2)),
            perdasPorMotivo: perdasPorMotivo,
            lucroLiquidoReal: Number(lucroLiquidoReal.toFixed(2)),
            margemLiquidaPercentual: receitaBruta > 0 ? Number(((lucroLiquidoReal / receitaBruta) * 100).toFixed(1)) : 0,
            totalAReceberFiado: Number(totalAReceber.toFixed(2)),
            totalRecebidoPix: Number(totalRecebidoPix.toFixed(2)),
            capitalEstoqueParado: Number(capitalEstoqueParado.toFixed(2)),
            totalVendasRealizadas: vendas.length,
            historicoPerdas: perdas
        };
    }
}