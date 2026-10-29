export class EstornarVenda {
    constructor(repositorioVendas, repositorioProdutos, repositorioClientes) {
        this.repositorioVendas = repositorioVendas;
        this.repositorioProdutos = repositorioProdutos;
        this.repositorioClientes = repositorioClientes;
    }

    async executar({ vendaId }) {
        if (!vendaId) throw new Error("Identificador da venda é obrigatório.");

        const venda = await this.repositorioVendas.obterPorId(vendaId);
        if (!venda) throw new Error("Venda não encontrada no banco de dados.");

        // Trava de segurança: Vendas com mais de 30 dias não podem ser desfeitas
        const dataVenda = new Date(venda.data_hora || venda.dataHora);
        const agora = new Date();
        const diasDecorridos = (agora - dataVenda) / (1000 * 60 * 60 * 24);

        if (diasDecorridos > 30) {
            throw new Error("Esta venda foi realizada há mais de 30 dias e não pode ser cancelada ou alterada.");
        }

        // 1. Devolver os chocolates para os lotes correspondentes
        const produtos = await this.repositorioProdutos.obterTodosComLotes();
        const mapaProdutos = new Map(produtos.map(p => [p.id, p]));
        const itensVenda = venda.itens || [];

        for (const item of itensVenda) {
            const produto = mapaProdutos.get(item.produtoId);
            if (produto) {
                let loteAlvo = produto.lotes.find(l => l.id === item.loteId);
                // Se o lote de origem não estiver mais ativo, devolve para o lote mais recente do produto
                if (!loteAlvo && produto.lotes.length > 0) {
                    loteAlvo = produto.lotes[produto.lotes.length - 1];
                }

                if (loteAlvo) {
                    loteAlvo.quantidadeAtual += item.quantidade;
                    await this.repositorioProdutos.salvarLote(loteAlvo);
                }
            }
        }

        // 2. Estornar saldo do cliente se a venda tiver sido Fiado (A_PRAZO)
        const tipoPag = venda.tipo_pagamento || venda.tipoPagamento;
        const clienteId = venda.cliente_id || venda.clienteId;

        if (tipoPag === 'A_PRAZO' && clienteId) {
            const clientes = await this.repositorioClientes.obterTodosComHistorico();
            const cliente = clientes.find(c => c.id === clienteId);

            if (cliente) {
                const valorVenda = Number(venda.valor_total || venda.valorTotal);
                cliente.saldoDevedor = Number(Math.max(0, cliente.saldoDevedor - valorVenda).toFixed(2));
                await this.repositorioClientes.salvarCliente(cliente);
            }
        }

        // 3. Exclui o registro da venda
        await this.repositorioVendas.remover(vendaId);

        return {
            sucesso: true,
            vendaCanceladaId: vendaId,
            clienteId: clienteId,
            tipoPagamento: tipoPag,
            itens: itensVenda,
            valorTotal: Number(venda.valor_total || venda.valorTotal)
        };
    }
}
