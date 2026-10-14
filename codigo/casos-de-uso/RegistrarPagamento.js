import { Pagamento } from '../dominio/Pagamento.js';

/**
 * CASO DE USO: RegistrarPagamento
 * Registra entradas financeiras amortizando o fiado de um cliente (total ou parcial).
 */
export class RegistrarPagamento {
    /**
     * @param {import('../repositorios/RepositorioClientes.js').RepositorioClientes} repositorioClientes
     */
    constructor(repositorioClientes) {
        this.repositorioClientes = repositorioClientes;
    }

    /**
     * @param {Object} parametros
     * @param {string} parametros.clienteId - ID do cliente que está pagando
     * @param {number} parametros.valor - Valor pago em Reais
     * @param {string} [parametros.metodo] - 'PIX' ou 'DINHEIRO' (Padrão: 'PIX')
     * @param {string} [parametros.observacao] - Ex: "Acerto referente ao mês de Outubro"
     */
    async executar({ clienteId, valor, metodo = 'PIX', observacao = '' }) {
        if (!clienteId) {
            throw new Error("É necessário informar o cliente para registrar o pagamento.");
        }

        const valorPago = Number(valor);
        if (isNaN(valorPago) || valorPago <= 0) {
            throw new Error("O valor do pagamento deve ser maior que zero.");
        }

        // 1. Busca os clientes cadastrados
        const clientes = await this.repositorioClientes.obterTodosComHistorico();
        const cliente = clientes.find(c => c.id === clienteId);

        if (!cliente) {
            throw new Error("Cliente não encontrado.");
        }

        if (cliente.saldoDevedor === 0) {
            throw new Error(`O cliente ${cliente.nome} não possui saldo devedor em aberto.`);
        }

        // 2. Cria a entidade Pagamento
        const novoPagamento = new Pagamento({
            clienteId: cliente.id,
            valor: valorPago,
            metodo: metodo,
            observacao: observacao
        });

        // 3. Aplica a regra de negócio do Domínio (amortização)
        const saldoAnterior = cliente.saldoDevedor;
        const resultadoAmortizacao = cliente.amortizarDivida(novoPagamento);

        // 4. Grava o pagamento na tabela 'pagamentos'
        await this.repositorioClientes.registrarPagamento(novoPagamento);

        // 5. Atualiza o saldo devedor restante na tabela 'clientes'
        await this.repositorioClientes.salvarCliente(cliente);

        const quitouTotalmente = resultadoAmortizacao.saldoRestante === 0;

        return {
            sucesso: true,
            clienteNome: cliente.nome,
            valorPago: valorPago,
            saldoAnterior: saldoAnterior,
            saldoRestante: resultadoAmortizacao.saldoRestante,
            quitado: quitouTotalmente,
            mensagem: quitouTotalmente
                ? `Dívida de ${cliente.nome} quitada integralmente!`
                : `Pagamento parcial registrado. Saldo restante de ${cliente.nome}: R$ ${resultadoAmortizacao.saldoRestante.toFixed(2)}`
        };
    }
}