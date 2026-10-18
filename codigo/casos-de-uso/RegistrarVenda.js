 import { Venda } from '../dominio/Venda.js';

/**
 * CASO DE USO: RegistrarVenda
 * Orquestra a baixa no estoque por PEPS (FIFO), aceita preço personalizado/desconto e atualiza fiado.
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
     * @param {string|null} dadosVenda.clienteId
     * @param {Array<{produtoId: string, quantidade: number, precoVendaPersonalizado?: number}>} dadosVenda.itens
     * @param {string} dadosVenda.tipoPagamento
     * @param {string} [dadosVenda.origem]
     * @param {string} [dadosVenda.observacao]
     */
    async executar({ clienteId, itens, tipoPagamento = 'A_PRAZO', origem = 'MANUAL', observacao = '' }) {
        if (!itens || itens.length === 0) {
            throw new Error("A venda precisa ter pelo menos um chocolate selecionado.");
        }

        const produtosCatalogo = await this.repositorioProdutos.obterTodosComLotes();
        const mapaProdutos = new Map(produtosCatalogo.map(p => [p.id, p]));

        // 1. Validação prévia de estoque
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

        // 2. Processamento PEPS (Baixa com preço customizado se houver)
        for (const itemPedido of itens) {
            const produto = mapaProdutos.get(itemPedido.produtoId);
            let quantidadeRestanteParaAbater = Number(itemPedido.quantidade);
            const lotesOrdenados = produto.obterLotesParaVenda();

            // Determina o preço de venda: customizado/com desconto ou o padrão de tabela
            const precoVendaFinal = (itemPedido.precoVendaPersonalizado !== undefined && Number(itemPedido.precoVendaPersonalizado) > 0)
                ? Number(Number(itemPedido.precoVendaPersonalizado).toFixed(2))
                : produto.precoVenda;

            for (const lote of lotesOrdenados) {
                if (quantidadeRestanteParaAbater <= 0) break;

                const quantidadeAbatidaDesteLote = lote.abaterQuantidade(quantidadeRestanteParaAbater);

                if (quantidadeAbatidaDesteLote > 0) {
                    itensVendaProcessados.push({
                        produtoId: produto.id,
                        nomeProduto: produto.nome,
                        quantidade: quantidadeAbatidaDesteLote,
                        precoVendaUnitario: precoVendaFinal,
                        custoUnitarioReal: lote.precoCustoUnitario,
                        loteId: lote.id
                    });

                    lotesParaAtualizarNoBanco.push(lote);
                    quantidadeRestanteParaAbater -= quantidadeAbatidaDesteLote;
                }
            }
        }

        // 3. Cria a entidade Venda
        const novaVenda = new Venda({
            clienteId: clienteId || null,
            itens: itensVendaProcessados,
            tipoPagamento: tipoPagamento,
            origem: origem,
            observacao: observacao
        });

        // 4. Salva lotes abatidos
        for (const lote of lotesParaAtualizarNoBanco) {
            await this.repositorioProdutos.salvarLote(lote);
        }

        // 5. Se for fiado, atualiza o saldo do colega
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

        // 6. Grava a venda no histórico
        await this.repositorioVendas.salvarVenda(novaVenda);

        return {
            sucesso: true,
            venda: novaVenda,
            lucroObtido: novaVenda.lucroBruto,
            cliente: clienteAtualizado
        };
    }
}