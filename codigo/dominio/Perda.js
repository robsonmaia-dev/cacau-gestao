/**
 * ENTIDADE: Perda
 * Registra saídas de estoque que geram prejuízo operacional (sem receita).
 */
export class Perda {
    static MOTIVOS_VALIDOS = ["VENCIMENTO", "AVARIA", "DESVIO", "CONSUMO_PROPRIO"];

    constructor({
        id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
        produtoId,
        nomeProduto,
        loteId,
        quantidade,
        custoUnitario,
        motivo,                         // "VENCIMENTO", "AVARIA", "DESVIO", "CONSUMO_PROPRIO"
        dataHora = new Date().toISOString(),
        observacao = ""
    }) {
        if (!produtoId) throw new Error("A perda precisa estar vinculada a um produtoId.");
        if (Number(quantidade) <= 0) throw new Error("A quantidade perdida deve ser maior que zero.");
        
        const motivoNormalizado = motivo ? motivo.toUpperCase() : "";
        if (!Perda.MOTIVOS_VALIDOS.includes(motivoNormalizado)) {
            throw new Error(`Motivo inválido. Escolha: ${Perda.MOTIVOS_VALIDOS.join(', ')}.`);
        }

        this.id = id;
        this.produtoId = produtoId;
        this.nomeProduto = nomeProduto;
        this.loteId = loteId;
        this.quantidade = Number(quantidade);
        this.custoUnitario = Number(custoUnitario);
        this.motivo = motivoNormalizado;
        this.dataHora = dataHora;
        this.observacao = observacao.trim();

        // Prejuízo financeiro real da perda
        this.prejuizoTotal = Number((this.quantidade * this.custoUnitario).toFixed(2));
    }
}