export class ObterBalancoFinanceiro {
    constructor(repositorioVendas, repositorioPerdas, repositorioProdutos, repositorioClientes) {
        this.repositorioVendas = repositorioVendas;
        this.repositorioPerdas = repositorioPerdas;
        this.repositorioProdutos = repositorioProdutos;
        this.repositorioClientes = repositorioClientes;
    }

    async executar() {
        const vendas = await this.repositorioVendas.obterTodas();
        const perdas = await this.repositorioPerdas.obterTodas();
        const produtos = await this.repositorioProdutos.obterTodosComLotes();
        const clientes = await this.repositorioClientes.obterTodosComHistorico();

        let receitaBruta = 0;
        let custoMercadoriasVendidas = 0;
        let totalRecebidoPix = 0;
        let totalVendidoFiado = 0;
        let cmvPix = 0;
        let cmvFiado = 0;

        vendas.forEach(v => {
            receitaBruta += v.valorTotal;
            custoMercadoriasVendidas += v.custoTotal;

            if (v.ehFiado()) {
                totalVendidoFiado += v.valorTotal;
                cmvFiado += v.custoTotal;
            } else {
                totalRecebidoPix += v.valorTotal;
                cmvPix += v.custoTotal;
            }
        });

        const lucroBruto = receitaBruta - custoMercadoriasVendidas;
        let prejuizoTotalPerdas = 0;
        const perdasPorMotivo = { VENCIMENTO: 0, AVARIA: 0, DESVIO: 0, CONSUMO_PROPRIO: 0 };

        perdas.forEach(p => {
            prejuizoTotalPerdas += p.prejuizoTotal;
            if (perdasPorMotivo[p.motivo] !== undefined) {
                perdasPorMotivo[p.motivo] += p.prejuizoTotal;
            }
        });

        const lucroLiquidoReal = lucroBruto - prejuizoTotalPerdas;
        const lucroRealizadoPix = Math.max(0, totalRecebidoPix - cmvPix);
        const lucroPendenteFiado = Math.max(0, totalVendidoFiado - cmvFiado);
        const totalAReceber = clientes.reduce((soma, c) => soma + c.saldoDevedor, 0);

        let capitalEstoqueParado = 0;
        produtos.forEach(p => {
            p.lotes.forEach(l => {
                if (!l.estaEsgotado()) {
                    capitalEstoqueParado += (l.quantidadeAtual * l.precoCustoUnitario);
                }
            });
        });

        return {
            receitaBruta: Number(receitaBruta.toFixed(2)),
            custoMercadoriasVendidas: Number(custoMercadoriasVendidas.toFixed(2)),
            lucroBruto: Number(lucroBruto.toFixed(2)),
            prejuizoTotalPerdas: Number(prejuizoTotalPerdas.toFixed(2)),
            perdasPorMotivo: perdasPorMotivo,
            lucroLiquidoReal: Number(lucroLiquidoReal.toFixed(2)),
            lucroRealizadoPix: Number(lucroRealizadoPix.toFixed(2)),
            lucroPendenteFiado: Number(lucroPendenteFiado.toFixed(2)),
            margemLiquidaPercentual: receitaBruta > 0 ? Number(((lucroLiquidoReal / receitaBruta) * 100).toFixed(1)) : 0,
            totalAReceberFiado: Number(totalAReceber.toFixed(2)),
            totalRecebidoPix: Number(totalRecebidoPix.toFixed(2)),
            capitalEstoqueParado: Number(capitalEstoqueParado.toFixed(2)),
            totalVendasRealizadas: vendas.length,
            historicoPerdas: perdas
        };
    }
}
