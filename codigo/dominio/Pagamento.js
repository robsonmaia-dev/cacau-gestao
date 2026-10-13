/**
 * ENTIDADE: Pagamento
 * Registra uma entrada financeira amortizando o saldo devedor de um cliente.
 */
export class Pagamento {
    constructor({
        id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
        clienteId,
        valor,
        dataHora = new Date().toISOString(),
        metodo = "PIX",
        observacao = ""
    }) {
        if (!clienteId) throw new Error("O pagamento precisa estar vinculado a um clienteId.");
        if (Number(valor) <= 0) throw new Error("O valor do pagamento deve ser maior que zero.");

        this.id = id;
        this.clienteId = clienteId;
        this.valor = Number(valor);
        this.dataHora = dataHora;
        this.metodo = metodo; // "PIX" ou "DINHEIRO"
        this.observacao = observacao.trim();
    }
}