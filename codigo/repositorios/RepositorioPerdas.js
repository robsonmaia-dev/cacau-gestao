import { RepositorioBase } from './RepositorioBase.js';
import { Perda } from '../dominio/Perda.js';

export class RepositorioPerdas extends RepositorioBase {
    constructor() {
        super('perdas');
    }

    async obterTodas() {
        const registros = await this.obterTodos('data_hora', false);
        return registros.map(item => new Perda({
            id: item.id,
            produtoId: item.produto_id,
            nomeProduto: item.nome_produto,
            loteId: item.lote_id,
            quantidade: item.quantidade,
            custoUnitario: item.custo_unitario,
            motivo: item.motivo,
            dataHora: item.data_hora,
            observacao: item.observacao
        }));
    }

    async salvarPerda(perda) {
        return await this.salvar({
            id: perda.id,
            produto_id: perda.produtoId,
            nome_produto: perda.nomeProduto,
            lote_id: perda.loteId,
            quantidade: perda.quantidade,
            custo_unitario: perda.custoUnitario,
            prejuizo_total: perda.prejuizoTotal,
            motivo: perda.motivo,
            observacao: perda.observacao,
            data_hora: perda.dataHora
        });
    }
}