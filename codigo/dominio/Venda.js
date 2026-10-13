/**
 * ENTIDADE: Venda
 * Registra a saída comercial de um ou mais produtos.
 */
export class Venda {
    constructor({
        id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
        clienteId = null,               // Obrigatório se for fiado ("A_PRAZO")
        itens = [],                     // Array de itens: { produtoId, nomeProduto, quantidade, precoVendaUnitario, custoUnitarioReal, loteId }
        tipoPagamento = "A_PRAZO",      // "PIX_IMEDIATO" ou "A_PRAZO"
        dataHora = new Date().toISOString(),
        origem = "MANUAL",              // "MANUAL" ou "IA_IMAGEM" (para entrada desacoplada)
        observacao = ""
    }) {
        if (!itens || itens.length === 0) {
            throw new Error("A venda precisa conter pelo menos um item.");
        }
        
        const tipoNormalizado = tipoPagamento.toUpperCase();
        if (!["PIX_IMEDIATO", "A_PRAZO"].includes(tipoNormalizado)) {
            throw new Error("Tipo de pagamento inválido. Use 'PIX_IMEDIATO' ou 'A_PRAZO'.");
        }

        if (tipoNormalizado === "A_PRAZO" && !clienteId) {
            throw new Error("Vendas a prazo (fiado) exigem a identificação do cliente.");
        }

        this.id = id;
        this.clienteId = clienteId;
        this.itens = itens.map(item => ({
            produtoId: item.produtoId,
            nomeProduto: item.nomeProduto,
            quantidade: Number(item.quantidade),
            precoVendaUnitario: Number(item.precoVendaUnitario),
            custoUnitarioReal: Number(item.custoUnitarioReal), // Travado no momento da venda (PEPS)
            loteId: item.loteId
        }));
        this.tipoPagamento = tipoNormalizado;
        this.dataHora = dataHora;
        this.origem = origem.toUpperCase();
        this.observacao = observacao.trim();

        // Totais calculados
        this.valorTotal = this.calcularValorTotal();
        this.custoTotal = this.calcularCustoTotal();
        this.lucroBruto = Number((this.valorTotal - this.custoTotal).toFixed(2));
    }

    calcularValorTotal() {
        const total = this.itens.reduce((soma, item) => 
            soma + (item.quantidade * item.precoVendaUnitario), 0);
        return Number(total.toFixed(2));
    }

    calcularCustoTotal() {
        const custo = this.itens.reduce((soma, item) => 
            soma + (item.quantidade * item.custoUnitarioReal), 0);
        return Number(custo.toFixed(2));
    }

    ehFiado() {
        return this.tipoPagamento === "A_PRAZO";
    }
}