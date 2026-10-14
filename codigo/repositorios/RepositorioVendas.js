import { RepositorioBase } from './RepositorioBase.js';
import { Venda } from '../dominio/Venda.js';

export class RepositorioVendas extends RepositorioBase {
    constructor() {
        super('vendas');
    }

    async obterTodas() {
        const registros = await this.obterTodos('data_hora', false);
        return registros.map(item => new Venda({
            id: item.id,
            clienteId: item.cliente_id,
            itens: item.itens,
            tipoPagamento: item.tipo_pagamento,
            dataHora: item.data_hora,
            origem: item.origem,
            observacao: item.observacao
        }));
    }

    async salvarVenda(venda) {
        return await this.salvar({
            id: venda.id,
            cliente_id: venda.clienteId,
            itens: venda.itens,
            valor_total: venda.valorTotal,
            custo_total: venda.custoTotal,
            lucro_bruto: venda.lucroBruto,
            tipo_pagamento: venda.tipoPagamento,
            origem: venda.origem,
            observacao: venda.observacao,
            data_hora: venda.dataHora
        });
    }
}