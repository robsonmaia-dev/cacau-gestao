import { LoteCompra } from '../dominio/LoteCompra.js';

/**
 * CASO DE USO: ComprarEstoque
 * Registra a entrada de novas unidades de um produto vindas do fornecedor.
 */
export class ComprarEstoque {
    /**
     * @param {import('../repositorios/RepositorioProdutos.js').RepositorioProdutos} repositorioProdutos
     */
    constructor(repositorioProdutos) {
        this.repositorioProdutos = repositorioProdutos;
    }

    /**
     * Executa a entrada de estoque gerando um novo lote
     * @param {Object} parametros
     * @param {string} parametros.produtoId - ID do chocolate no catálogo
     * @param {number} parametros.precoCustoUnitario - Quanto você pagou por unidade na promoção
     * @param {number} parametros.quantidade - Quantidade de unidades compradas
     * @param {string} parametros.dataValidade - Data de validade (formato: YYYY-MM-DD)
     * @param {string} [parametros.dataCompra] - Data da compra (opcional, padrão: agora)
     */
    async executar({ produtoId, precoCustoUnitario, quantidade, dataValidade, dataCompra }) {
        // 1. Validações prévias
        if (!produtoId) {
            throw new Error("É necessário selecionar um produto para dar entrada.");
        }

        const qtd = Number(quantidade);
        if (isNaN(qtd) || qtd <= 0) {
            throw new Error("A quantidade comprada deve ser maior que zero.");
        }

        const custo = Number(precoCustoUnitario);
        if (isNaN(custo) || custo < 0) {
            throw new Error("O preço de custo não pode ser negativo.");
        }

        if (!dataValidade) {
            throw new Error("A data de validade é obrigatória para o controle PEPS e alertas de vencimento.");
        }

        // 2. Cria a entidade de Lote de Compra
        const novoLote = new LoteCompra({
            produtoId: produtoId,
            precoCustoUnitario: custo,
            quantidadeInicial: qtd,
            quantidadeAtual: qtd,
            dataCompra: dataCompra || new Date().toISOString(),
            dataValidade: dataValidade
        });

        // 3. Grava o novo lote no PostgreSQL (Supabase)
        await this.repositorioProdutos.salvarLote(novoLote);

        return {
            sucesso: true,
            mensagem: `Entrada de ${qtd} unidades registrada com sucesso!`,
            loteCriado: novoLote
        };
    }
}