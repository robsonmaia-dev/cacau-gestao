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
        // 1. Busca os clientes
        const { data: clientesData, error: erroClientes } = await this.cliente
            .from('clientes')
            .select('*')
            .order('nome', { ascending: true });

        if (erroClientes) {
            console.error("Erro ao buscar clientes:", erroClientes);
            throw new Error(`Falha nos clientes: ${erroClientes.message}`);
        }

        // 2. Busca os pagamentos
        const { data: pagamentosData, error: erroPagamentos } = await this.cliente
            .from('pagamentos')
            .select('*');

        if (erroPagamentos) {
            console.error("Erro ao buscar pagamentos:", erroPagamentos);
            throw new Error(`Falha nos pagamentos: ${erroPagamentos.message}`);
        }

        // 3. Agrupa os pagamentos por clienteId
        const mapaPagamentos = new Map();
        (pagamentosData || []).forEach(pag => {
            if (!mapaPagamentos.has(pag.cliente_id)) {
                mapaPagamentos.set(pag.cliente_id, []);
            }
            mapaPagamentos.get(pag.cliente_id).push(new Pagamento({
                id: pag.id,
                clienteId: pag.cliente_id,
                valor: pag.valor,
                metodo: pag.metodo,
                observacao: pag.observacao,
                dataHora: pag.data_hora
            }));
        });

        // 4. Monta as instâncias de Cliente
        return (clientesData || []).map(item => new Cliente({
            id: item.id,
            nome: item.nome,
            canalPreferencial: item.canal_preferencial,
            contato: item.contato,
            saldoDevedor: item.saldo_devedor,
            historicoPagamentos: mapaPagamentos.get(item.id) || []
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