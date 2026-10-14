import { RepositorioBase } from './RepositorioBase.js';
import { Cliente } from '../dominio/Cliente.js';
import { Pagamento } from '../dominio/Pagamento.js';

export class RepositorioClientes extends RepositorioBase {
    constructor() {
        super('clientes');
    }

    /**
     * Busca todos os clientes com o histórico completo de pagamentos
     */
    async obterTodosComHistorico() {
        const { data, error } = await this.cliente
            .from('clientes')
            .select(`
                *,
                pagamentos(*)
            `)
            .order('nome', { ascending: true });

        if (error) {
            console.error("Erro ao buscar clientes:", error);
            throw new Error("Falha ao carregar carteira de clientes.");
        }

        return (data || []).map(item => new Cliente({
            id: item.id,
            nome: item.nome,
            canalPreferencial: item.canal_preferencial,
            contato: item.contato,
            saldoDevedor: item.saldo_devedor,
            historicoPagamentos: (item.pagamentos || []).map(pag => new Pagamento({
                id: pag.id,
                clienteId: pag.cliente_id,
                valor: pag.valor,
                metodo: pag.metodo,
                observacao: pag.observacao,
                dataHora: pag.data_hora
            }))
        }));
    }

    /**
     * Salva os dados do cliente e seu saldo devedor atualizado
     */
    async salvarCliente(cliente) {
        return await this.salvar({
            id: cliente.id,
            nome: cliente.nome,
            canal_preferencial: cliente.canalPreferencial,
            contato: cliente.contato,
            saldo_devedor: cliente.saldoDevedor
        });
    }

    /**
     * Registra uma amortização de pagamento no banco
     */
    async registrarPagamento(pagamento) {
        const { data, error } = await this.cliente
            .from('pagamentos')
            .insert({
                id: pagamento.id,
                cliente_id: pagamento.clienteId,
                valor: pagamento.valor,
                metodo: pagamento.metodo,
                observacao: pagamento.observacao,
                data_hora: pagamento.dataHora
            })
            .select();

        if (error) throw new Error(`Falha ao registrar pagamento: ${error.message}`);
        return data ? data[0] : null;
    }
}