export class CalcularPrevisaoReposicao {
    constructor(repositorioProdutos, repositorioVendas) {
        this.repositorioProdutos = repositorioProdutos;
        this.repositorioVendas = repositorioVendas;
    }

    async executar() {
        const produtos = await this.repositorioProdutos.obterTodosComLotes();
        const vendas = await this.repositorioVendas.obterTodas();

        if (vendas.length === 0) {
            return produtos.map(p => ({
                produtoId: p.id,
                nome: p.nome,
                estoqueAtual: p.obterEstoqueTotal(),
                consumoDiarioMedio: 0,
                diasCobertura: Infinity,
                status: p.obterEstoqueTotal() === 0 ? 'ESGOTADO' : 'SEM_HISTORICO'
            }));
        }

        const datas = vendas.map(v => new Date(v.dataHora).getTime());
        const dataMinima = Math.min(...datas);
        const dataMaxima = Math.max(...datas);
        const agora = new Date().getTime();

        const diasEntreVendas = Math.ceil((dataMaxima - dataMinima) / (1000 * 60 * 60 * 24));
        const diasAteHoje = Math.ceil((agora - dataMinima) / (1000 * 60 * 60 * 24));

        let diferencaDias = Math.max(diasEntreVendas, diasAteHoje);
        if (diferencaDias < 7) {
            diferencaDias = 20; // 20 dias úteis padrão corporativo
        }

        const vendasPorProduto = new Map();
        vendas.forEach(v => {
            v.itens.forEach(item => {
                const total = vendasPorProduto.get(item.produtoId) || 0;
                vendasPorProduto.set(item.produtoId, total + item.quantidade);
            });
        });

        return produtos.map(prod => {
            const estoqueAtual = prod.obterEstoqueTotal();
            const totalVendido = vendasPorProduto.get(prod.id) || 0;
            const consumoDiarioMedio = Number((totalVendido / diferencaDias).toFixed(2));

            let diasCobertura = Infinity;
            let status = 'ESTAVEL';

            if (estoqueAtual === 0) {
                status = 'ESGOTADO';
                diasCobertura = 0;
            } else if (consumoDiarioMedio > 0) {
                diasCobertura = Math.ceil(estoqueAtual / consumoDiarioMedio);

                if (diasCobertura <= 3) {
                    status = 'CRITICO';
                } else if (diasCobertura <= 7 || prod.precisaDeReposicao()) {
                    status = 'ATENCAO';
                }
            } else if (prod.precisaDeReposicao()) {
                status = 'ATENCAO';
            }

            return {
                produtoId: prod.id,
                nome: prod.nome,
                estoqueAtual: estoqueAtual,
                consumoDiarioMedio: consumoDiarioMedio,
                diasCobertura: diasCobertura === Infinity ? null : diasCobertura,
                status: status
            };
        }).sort((a, b) => {
            const prioridade = { ESGOTADO: 0, CRITICO: 1, ATENCAO: 2, SEM_HISTORICO: 3, ESTAVEL: 4 };
            return prioridade[a.status] - prioridade[b.status];
        });
    }
}
