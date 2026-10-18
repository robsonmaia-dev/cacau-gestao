/**
 * CASO DE USO: ObterPerfilClientes
 * Identifica os maiores clientes da empresa (VIPs) e mede o nível de confiança da mesa (honestidade vs desvio).
 */
export class ObterPerfilClientes {
    /**
     * @param {import('../repositorios/RepositorioClientes.js').RepositorioClientes} repositorioClientes
     * @param {import('../repositorios/RepositorioVendas.js').RepositorioVendas} repositorioVendas
     * @param {import('../repositorios/RepositorioPerdas.js').RepositorioPerdas} repositorioPerdas
     */
    constructor(repositorioClientes, repositorioVendas, repositorioPerdas) {
        this.repositorioClientes = repositorioClientes;
        this.repositorioVendas = repositorioVendas;
        this.repositorioPerdas = repositorioPerdas;
    }

    async executar() {
        const clientes = await this.repositorioClientes.obterTodosComHistorico();
        const vendas = await this.repositorioVendas.obterTodas();
        const perdas = await this.repositorioPerdas.obterTodas();

        // 1. Consolida compras por cliente
        const mapaClientes = new Map();
        clientes.forEach(c => {
            mapaClientes.set(c.id, {
                id: c.id,
                nome: c.nome,
                canal: c.canalPreferencial,
                contato: c.contato,
                saldoDevedor: c.saldoDevedor,
                totalGasto: 0,
                quantidadeItens: 0,
                numeroCompras: 0
            });
        });

        let totalChocolatesVendidos = 0;

        vendas.forEach(v => {
            const totalItensVenda = v.itens.reduce((s, i) => s + i.quantidade, 0);
            totalChocolatesVendidos += totalItensVenda;

            if (v.clienteId && mapaClientes.has(v.clienteId)) {
                const dados = mapaClientes.get(v.clienteId);
                dados.totalGasto += v.valorTotal;
                dados.quantidadeItens += totalItensVenda;
                dados.numeroCompras += 1;
            }
        });

        // Ranking Top 5 Clientes VIP
        const clientesVip = Array.from(mapaClientes.values())
            .filter(c => c.totalGasto > 0)
            .sort((a, b) => b.totalGasto - a.totalGasto)
            .slice(0, 5)
            .map(c => ({
                ...c,
                totalGasto: Number(c.totalGasto.toFixed(2))
            }));

        // 2. Termômetro da Confiança (Honestidade na mesa)
        let totalChocolatesDesviados = 0;
        perdas.forEach(p => {
            if (p.motivo === 'DESVIO') {
                totalChocolatesDesviados += p.quantidade;
            }
        });

        const totalChocolatesRetirados = totalChocolatesVendidos + totalChocolatesDesviados;
        let taxaHonestidade = 100;

        if (totalChocolatesRetirados > 0) {
            taxaHonestidade = Number(((totalChocolatesVendidos / totalChocolatesRetirados) * 100).toFixed(1));
        }

        return {
            clientesVip,
            termometroConfianca: {
                totalVendidosHonestamente: totalChocolatesVendidos,
                totalDesviosNaoPagos: totalChocolatesDesviados,
                taxaHonestidadePercentual: taxaHonestidade
            }
        };
    }
}