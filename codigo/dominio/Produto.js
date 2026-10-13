import { LoteCompra } from './LoteCompra.js';

/**
 * ENTIDADE: Produto
 * Representa um item do catálogo da Cacau Show comercializado por você.
 */
export class Produto {
    constructor({
        id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
        nome,
        categoria = "Geral",
        precoVenda,
        estoqueMinimo = 5,
        lotes = []
    }) {
        if (!nome || nome.trim() === "") throw new Error("O nome do produto é obrigatório.");
        if (precoVenda <= 0) throw new Error("O preço de venda deve ser maior que zero.");

        this.id = id;
        this.nome = nome.trim();
        this.categoria = categoria;
        this.precoVenda = Number(precoVenda);
        this.estoqueMinimo = Number(estoqueMinimo);
        
        // Garante que os lotes sejam instâncias da classe LoteCompra
        this.lotes = lotes.map(lote => lote instanceof LoteCompra ? lote : new LoteCompra(lote));
    }

    /**
     * Retorna a quantidade total somando todos os lotes que ainda têm estoque
     */
    obterEstoqueTotal() {
        return this.lotes.reduce((total, lote) => total + lote.quantidadeAtual, 0);
    }

    /**
     * Regra: Quando comprar mais?
     */
    precisaDeReposicao() {
        return this.obterEstoqueTotal() <= this.estoqueMinimo;
    }

    /**
     * Adiciona um novo lote de compra a este produto
     */
    adicionarLote(dadosLote) {
        const novoLote = dadosLote instanceof LoteCompra 
            ? dadosLote 
            : new LoteCompra({ ...dadosLote, produtoId: this.id });
        
        this.lotes.push(novoLote);
    }

    /**
     * Retorna lotes com estoque positivo ordenados por prioridade de saída (PEPS: primeiro os mais próximos de vencer)
     */
    obterLotesParaVenda() {
        return this.lotes
            .filter(lote => !lote.estaEsgotado())
            .sort((a, b) => {
                if (!a.dataValidade) return 1;
                if (!b.dataValidade) return -1;
                return new Date(a.dataValidade) - new Date(b.dataValidade);
            });
    }

    /**
     * Retorna o custo médio ponderado do estoque atual (para fins de balanço rápido)
     */
    calcularCustoMedioAtual() {
        const estoqueTotal = this.obterEstoqueTotal();
        if (estoqueTotal === 0) return 0;

        const valorTotalInvestido = this.lotes
            .filter(lote => !lote.estaEsgotado())
            .reduce((soma, lote) => soma + (lote.quantidadeAtual * lote.precoCustoUnitario), 0);

        return Number((valorTotalInvestido / estoqueTotal).toFixed(2));
    }
}