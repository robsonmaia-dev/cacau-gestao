/**
 * ENTIDADE: LoteCompra
 * Representa uma compra específica de um produto no fornecedor.
 * Permite controle de custos variáveis e vencimento (PEPS).
 */
export class LoteCompra {
    constructor({
        id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
        produtoId,
        precoCustoUnitario,
        quantidadeInicial,
        quantidadeAtual = null,
        dataCompra = new Date().toISOString(),
        dataValidade
    }) {
        if (!produtoId) throw new Error("O lote precisa estar vinculado a um produtoId.");
        if (precoCustoUnitario < 0) throw new Error("O preço de custo não pode ser negativo.");
        if (quantidadeInicial <= 0) throw new Error("A quantidade comprada deve ser maior que zero.");

        this.id = id;
        this.produtoId = produtoId;
        this.precoCustoUnitario = Number(precoCustoUnitario);
        this.quantidadeInicial = Number(quantidadeInicial);
        this.quantidadeAtual = quantidadeAtual !== null ? Number(quantidadeAtual) : Number(quantidadeInicial);
        this.dataCompra = dataCompra;
        this.dataValidade = dataValidade; // Formato YYYY-MM-DD
    }

    /**
     * Dá baixa de unidades deste lote específico
     * @param {number} quantidade 
     * @returns {number} Quantidade efetivamente abatida
     */
    abaterQuantidade(quantidade) {
        if (quantidade <= 0) return 0;
        
        const quantidadeParaAbater = Math.min(this.quantidadeAtual, quantidade);
        this.quantidadeAtual -= quantidadeParaAbater;
        return quantidadeParaAbater;
    }

    estaEsgotado() {
        return this.quantidadeAtual <= 0;
    }

    diasAteVencer() {
        if (!this.dataValidade) return Infinity;
        const hoje = new Date();
        const validade = new Date(this.dataValidade + "T23:59:59");
        const diferencaMs = validade - hoje;
        return Math.ceil(diferencaMs / (1000 * 60 * 60 * 24));
    }

    estaVencido() {
        return this.diasAteVencer() < 0;
    }

    estaProximoDoVencimento(diasLimite = 15) {
        const dias = this.diasAteVencer();
        return dias >= 0 && dias <= diasLimite;
    }
}