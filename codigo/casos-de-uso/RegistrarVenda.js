import { Venda } from '../dominio/Venda.js';

/**
 * CASO DE USO: RegistrarVenda
 * Orquestra a baixa no estoque por PEPS (FIFO), cálculo de custos e atualização do fiado.
 */
export class RegistrarVenda {
    /**
     * @param {import('../repositorios/RepositorioProdutos.js').RepositorioProdutos} repositorioProdutos
     * @param {import('../repositorios/RepositorioClientes.js').RepositorioClientes} repositorioClientes
     * @param {import('../repositorios/RepositorioVendas.js').RepositorioVendas} repositorioVendas
     */
    constructor(repositorioProdutos, repositorioClientes, repositorioVendas) {
        this.repositorioProdutos = repositorioProdutos;
        this.repositorioClientes = repositorioClientes;
        this.repositorioVendas = repositorioVendas;
    }

    /**
     * @param {Object} dadosVenda
     * @param {string|null} dadosVenda.clienteId - Obrigatório se tipoPagamento for 'A_PRAZO'
     * @param {Array<{produtoId: string, quantidade: number}>} dadosVenda.itens
     * @param {string} dadosVenda.tipoPagamento - 'PIX_IMEDIATO' ou 'A_PRAZO'
     * @param {string} [dadosVenda.origem] - 'MANUAL' ou 'IA_IMAGEM'
     * @param {string} [dadosVenda.observacao]
     */
    async executar({ clienteId, itens, tipoPagamento = 'A_PRAZO', origem = 'MANUAL', observacao = '' }) {
        if (!itens || itens.length === 0) {
            throw new Error("A venda precisa ter pelo menos um chocolate selecionado.");
        }

        // 1. Carrega todos os produtos com seus lotes atuais
        const produtosCatalogo = await this.repositorioProdutos.obterTodosComLotes();
        const mapaProdutos = new Map(produtosCatalogo.map(p => [p.id, p]));

        // 2. Validação prévia de estoque antes de qualquer alteração
        for (const itemPedido of itens) {
            const produto = mapaProdutos.get(itemPedido.produtoId);
            if (!produto) {
                throw new Error(`Produto não encontrado (ID: ${itemPedido.produtoId}).`);
            }

            const estoqueDisponivel = produto.obterEstoqueTotal();
            if (estoqueDisponivel < itemPedido.quantidade) {
                throw new Error(
                    `Estoque insuficiente para "${produto.nome}". Pedido: ${itemPedido.quantidade}, Disponível: ${estoqueDisponivel}.`
                );
            }
        }

        const itensVendaProcessados = [];
        const lotesParaAtualizarNoBanco = [];

        // 3. Processamento PEPS (Baixa priorizando os lotes mais próximos do vencimento)
        for (const itemPedido of itens) {
            const produto = mapaProdutos.get(itemPedido.produtoId);
            let quantidadeRestanteParaAbater = Number(itemPedido.quantidade);
            const lotesOrdenados = produto.obterLotesParaVenda();

            for (const lote of lotesOrdenados) {
                if (quantidadeRestanteParaAbater <= 0) break;

                const quantidadeAbatidaDesteLote = lote.abaterQuantidade(quantidadeRestanteParaAbater);

                if (quantidadeAbatidaDesteLote > 0) {
                    // Registra o item travando o custo exato do lote consumido
                    itensVendaProcessados.push({
                        produtoId: produto.id,
                        nomeProduto: produto.nome,
                        quantidade: quantidadeAbatidaDesteLote,
                        precoVendaUnitario: produto.precoVenda,
                        custoUnitarioReal: lote.precoCustoUnitario,
                        loteId: lote.id
                    });

                    lotesParaAtualizarNoBanco.push(lote);
                    quantidadeRestanteParaAbater -= quantidadeAbatidaDesteLote;
                }
            }
        }

        // 4. Cria a entidade Venda (ela calcula automaticamente o valor total e o lucro real)
        const novaVenda = new Venda({
            clienteId: clienteId || null,
            itens: itensVendaProcessados,
            tipoPagamento: tipoPagamento,
            origem: origem,
            observacao: observacao
        });

        // 5. Persiste as alterações de estoque dos lotes afetados
        for (const lote of lotesParaAtualizarNoBanco) {
            await this.repositorioProdutos.salvarLote(lote);
        }

        // 6. Se for Fiado ("A_PRAZO"), atualiza a conta-corrente do cliente
        let clienteAtualizado = null;
        if (novaVenda.ehFiado()) {
            const clientes = await this.repositorioClientes.obterTodosComHistorico();
            const cliente = clientes.find(c => c.id === clienteId);

            if (!cliente) {
                throw new Error("Cliente não encontrado para registrar o fiado.");
            }

            cliente.adicionarDebito(novaVenda.valorTotal);
            await this.repositorioClientes.salvarCliente(cliente);
            clienteAtualizado = cliente;
        }

        // 7. Grava o registro da venda no histórico do banco
        await this.repositorioVendas.salvarVenda(novaVenda);

        return {
            sucesso: true,
            venda: novaVenda,
            lucroObtido: novaVenda.lucroBruto,
            cliente: clienteAtualizado
        };
    }
}