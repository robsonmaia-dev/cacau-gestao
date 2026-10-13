import { Pagamento } from './Pagamento.js';

/**
 * ENTIDADE: Cliente
 * Representa o comprador/colega da empresa e seu saldo devedor (fiado).
 */
export class Cliente {
    constructor({
        id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
        nome,
        canalPreferencial = "TEAMS", // "TEAMS" ou "WHATSAPP"
        contato,                     // E-mail corporativo (Teams) ou Telefone com DDD (WhatsApp)
        saldoDevedor = 0,
        historicoPagamentos = []
    }) {
        if (!nome || nome.trim() === "") throw new Error("O nome do cliente é obrigatório.");
        if (!contato || contato.trim() === "") throw new Error("O contato (e-mail ou celular) é obrigatório.");

        const canalNormalizado = canalPreferencial.toUpperCase();
        if (!["TEAMS", "WHATSAPP"].includes(canalNormalizado)) {
            throw new Error("Canal preferencial inválido. Use 'TEAMS' ou 'WHATSAPP'.");
        }

        this.id = id;
        this.nome = nome.trim();
        this.canalPreferencial = canalNormalizado;
        this.contato = contato.trim();
        this.saldoDevedor = Number(Number(saldoDevedor).toFixed(2));
        
        // Hidrata pagamentos prévios
        this.historicoPagamentos = historicoPagamentos.map(pag => 
            pag instanceof Pagamento ? pag : new Pagamento(pag)
        );
    }

    /**
     * Acrescenta uma compra fiada ao saldo do cliente
     */
    adicionarDebito(valor) {
        if (valor <= 0) return;
        this.saldoDevedor = Number((this.saldoDevedor + Number(valor)).toFixed(2));
    }

    /**
     * Amortiza a dívida (parcial ou total) e registra no histórico
     * @param {Object} dadosPagamento - { valor, metodo, observacao }
     * @returns {Object} { valorPago, saldoRestante }
     */
    amortizarDivida(dadosPagamento) {
        const pagamento = dadosPagamento instanceof Pagamento 
            ? dadosPagamento 
            : new Pagamento({ ...dadosPagamento, clienteId: this.id });

        if (pagamento.valor > this.saldoDevedor) {
            console.warn(`Aviso: O pagamento de R$ ${pagamento.valor} é maior que a dívida de R$ ${this.saldoDevedor}.`);
        }

        // Subtrai do saldo até no máximo zerar
        this.saldoDevedor = Number(Math.max(0, this.saldoDevedor - pagamento.valor).toFixed(2));
        this.historicoPagamentos.push(pagamento);

        return {
            valorPago: pagamento.valor,
            saldoRestante: this.saldoDevedor
        };
    }

    /**
     * Verifica se o cliente tem pendências a serem cobradas
     */
    possuiDebito() {
        return this.saldoDevedor > 0;
    }

    /**
     * Formata o telefone para link direto do WhatsApp (apenas números)
     */
    obterTelefoneLimpoWhatsApp() {
        if (this.canalPreferencial !== "WHATSAPP") return null;
        const numeros = this.contato.replace(/\D/g, '');
        // Adiciona 55 (Brasil) caso não tenha
        return numeros.startsWith('55') ? numeros : `55${numeros}`;
    }
}