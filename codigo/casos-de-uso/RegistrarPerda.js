import { Perda } from '../dominio/Perda.js';

/**
 * CASO DE USO: RegistrarPerda
 * Dá baixa no estoque por motivo de avaria, vencimento, desvio ou consumo próprio.
 */
export class RegistrarPerda {
    /**
     * @param {import('../repositorios/RepositorioProdutos.js').RepositorioProdutos} repositorioProdutos
     * @param {import('../repositorios/RepositorioPerdas.js').RepositorioPerdas} repositorioPerdas
     */
    constructor(repositorioProdutos, repositorioPerdas) {
        this.repositorioProdutos = repositorioProdutos;
        this.repositorioPerdas = repositorioPerdas;
    }

    /**
     * @param {Object} parametros
     * @param {string} parametros.produtoId - ID do produto perdido
     * @param {number} parametros.quantidade - Quantidade de unidades perdidas
     * @param {string} parametros.motivo - 'VENCIMENTO', 'AVARIA', 'DESVIO' ou 'CONSUMO_PROPRIO'
     * @param {string} [parametros.loteId] - Opcional. Se não informado, baixa pelo PEPS (lote mais antigo)
     * @param {string} [parametros.observacao] - Ex: "Derreteu pelo calor da janela"
     */
    async executar({ produtoId, quantidade, motivo, loteId = null, observacao = '' }) {
        if (!produtoId) {
            throw new Error("É necessário identificar o produto que teve perda.");
        }

        const qtd = Number(quantidade);
        if (isNaN(qtd) || qtd <= 0) {
            throw new Error("A quantidade de perda deve ser maior que zero.");
        }

        // 1. Busca o produto e seus lotes
        const produtos = await this.repositorioProdutos.obterTodosComLotes();
        const produto = produtos.find(p => p.id === produtoId);

        if (!produto) {
            throw new Error("Produto não encontrado.");
        }

        const estoqueDisponivel = produto.obterEstoqueTotal();
        if (estoqueDisponivel < qtd) {
            throw new Error(
                `Não é possível registrar perda de ${qtd} un. Estoque atual de "${produto.nome}": apenas ${estoqueDisponivel} un.`
            );
        }

        let quantidadeRestante = qtd;
        const perdasGeradas = [];
        const lotesParaAtualizar = [];

        // 2. Se um lote específico foi selecionado (ex: lote que venceu)
        if (loteId) {
            const lote = produto.lotes.find(l => l.id === loteId);
            if (!lote) throw new Error("Lote especificado não foi encontrado.");
            if (lote.quantidadeAtual < qtd) {
                throw new Error(`O lote selecionado possui apenas ${lote.quantidadeAtual} unidades.`);
            }

            lote.abaterQuantidade(qtd);
            lotesParaAtualizar.push(lote);

            perdasGeradas.push(new Perda({
                produtoId: produto.id,
                nomeProduto: produto.nome,
                loteId: lote.id,
                quantidade: qtd,
                custoUnitario: lote.precoCustoUnitario,
                motivo: motivo,
                observacao: observacao
            }));
        } else {
            // 3. Caso não tenha especificado o lote, consome pelo PEPS (mais antigo primeiro)
            const lotesOrdenados = produto.obterLotesParaVenda();

            for (const lote of lotesOrdenados) {
                if (quantidadeRestante <= 0) break;

                const abatido = lote.abaterQuantidade(quantidadeRestante);
                if (abatido > 0) {
                    lotesParaAtualizar.push(lote);

                    perdasGeradas.push(new Perda({
                        produtoId: produto.id,
                        nomeProduto: produto.nome,
                        loteId: lote.id,
                        quantidade: abatido,
                        custoUnitario: lote.precoCustoUnitario,
                        motivo: motivo,
                        observacao: observacao
                    }));

                    quantidadeRestante -= abatido;
                }
            }
        }

        // 4. Salva a atualização dos lotes no banco
        for (const lote of lotesParaAtualizar) {
            await this.repositorioProdutos.salvarLote(lote);
        }

        // 5. Salva o histórico de perdas geradas
        let prejuizoTotalAcumulado = 0;
        for (const perda of perdasGeradas) {
            await this.repositorioPerdas.salvarPerda(perda);
            prejuizoTotalAcumulado += perda.prejuizoTotal;
        }

        return {
            sucesso: true,
            mensagem: `Baixa de ${qtd} unidade(s) de "${produto.nome}" registrada com sucesso.`,
            prejuizoTotal: Number(prejuizoTotalAcumulado.toFixed(2)),
            estoqueRestante: produto.obterEstoqueTotal()
        };
    }
}