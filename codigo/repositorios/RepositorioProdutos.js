import { RepositorioBase } from './RepositorioBase.js';
import { Produto } from '../dominio/Produto.js';
import { LoteCompra } from '../dominio/LoteCompra.js';

export class RepositorioProdutos extends RepositorioBase {
    constructor() {
        super('produtos');
    }

    /**
     * Busca todos os produtos trazendo seus respectivos lotes de compra
     */
    async obterTodosComLotes() {
        // 1. Busca todos os produtos
        const { data: produtosData, error: erroProdutos } = await this.cliente
            .from('produtos')
            .select('*')
            .order('nome', { ascending: true });

        if (erroProdutos) {
            console.error("Erro ao buscar produtos:", erroProdutos);
            throw new Error(`Falha nos produtos: ${erroProdutos.message}`);
        }

        // 2. Busca todos os lotes de compra
        const { data: lotesData, error: erroLotes } = await this.cliente
            .from('lotes_compra')
            .select('*');

        if (erroLotes) {
            console.error("Erro ao buscar lotes:", erroLotes);
            throw new Error(`Falha nos lotes: ${erroLotes.message}`);
        }

        // 3. Agrupa os lotes por produtoId
        const mapaLotes = new Map();
        (lotesData || []).forEach(lote => {
            if (!mapaLotes.has(lote.produto_id)) {
                mapaLotes.set(lote.produto_id, []);
            }
            mapaLotes.get(lote.produto_id).push(new LoteCompra({
                id: lote.id,
                produtoId: lote.produto_id,
                precoCustoUnitario: lote.preco_custo_unitario,
                quantidadeInicial: lote.quantidade_inicial,
                quantidadeAtual: lote.quantidade_atual,
                dataCompra: lote.data_compra,
                dataValidade: lote.data_validade
            }));
        });

        // 4. Monta as instâncias de Produto
        return (produtosData || []).map(item => new Produto({
            id: item.id,
            nome: item.nome,
            categoria: item.categoria,
            precoVenda: item.preco_venda,
            estoqueMinimo: item.estoque_minimo,
            lotes: mapaLotes.get(item.id) || []
        }));
    }

    /**
     * Salva ou atualiza os dados cadastrais do Produto
     */
    async salvarProduto(produto) {
        return await this.salvar({
            id: produto.id,
            nome: produto.nome,
            categoria: produto.categoria,
            preco_venda: produto.precoVenda,
            estoque_minimo: produto.estoqueMinimo
        });
    }

    /**
     * Salva ou atualiza um lote de compra na tabela 'lotes_compra'
     */
    async salvarLote(lote) {
        const { data, error } = await this.cliente
            .from('lotes_compra')
            .upsert({
                id: lote.id,
                produto_id: lote.produtoId,
                preco_custo_unitario: lote.precoCustoUnitario,
                quantidade_inicial: lote.quantidadeInicial,
                quantidade_atual: lote.quantidadeAtual,
                data_compra: lote.dataCompra,
                data_validade: lote.dataValidade
            })
            .select();

        if (error) throw new Error(`Falha ao salvar lote: ${error.message}`);
        return data ? data[0] : null;
    }
}