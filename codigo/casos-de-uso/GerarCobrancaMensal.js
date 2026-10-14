/**
 * CASO DE USO: GerarCobrancaMensal
 * Consolida o extrato de consumo do cliente e formata a mensagem para Teams ou WhatsApp.
 */
export class GerarCobrancaMensal {
    /**
     * @param {import('../repositorios/RepositorioVendas.js').RepositorioVendas} repositorioVendas
     */
    constructor(repositorioVendas) {
        this.repositorioVendas = repositorioVendas;
    }

    /**
     * @param {Object} parametros
     * @param {import('../dominio/Cliente.js').Cliente} parametros.cliente
     * @param {string} parametros.chavePix - Sua chave Pix para pagamento
     * @param {string} [parametros.linkCatalogo] - Link do Drive/PDF da Cacau Show
     */
    async executar({ cliente, chavePix, linkCatalogo = '' }) {
        if (!cliente) throw new Error("Cliente não informado para cobrança.");
        if (!chavePix) throw new Error("Chave Pix não configurada.");

        // 1. Busca todas as vendas do cliente que foram feitas a prazo (fiado)
        const todasVendas = await this.repositorioVendas.obterTodas();
        const vendasCliente = todasVendas.filter(v => v.clienteId === cliente.id && v.ehFiado());

        // 2. Agrupa os itens consumidos (Ex: 3x Trufa LaNut, 1x Tablete)
        const mapaItensConsumidos = new Map();
        vendasCliente.forEach(venda => {
            venda.itens.forEach(item => {
                const atual = mapaItensConsumidos.get(item.nomeProduto) || { quantidade: 0, total: 0 };
                mapaItensConsumidos.set(item.nomeProduto, {
                    quantidade: atual.quantidade + item.quantidade,
                    total: atual.total + (item.quantidade * item.precoVendaUnitario)
                });
            });
        });

        // 3. Monta as linhas de extrato
        let linhasExtrato = "";
        if (mapaItensConsumidos.size > 0) {
            mapaItensConsumidos.forEach((info, nomeProduto) => {
                linhasExtrato += `• ${info.quantidade}x ${nomeProduto} (R$ ${info.total.toFixed(2)})\n`;
            });
        } else {
            linhasExtrato = `• Saldo pendente acumulado anterior\n`;
        }

        const saldoFormatado = cliente.saldoDevedor.toFixed(2);

        // 4. Monta o texto de cobrança amigável
        let mensagem = `Olá, ${cliente.nome}! Tudo bem? 😊🍫\n\n`;
        mensagem += `Segue o fechamento dos seus chocolates deste mês:\n\n`;
        mensagem += `${linhasExtrato}\n`;
        mensagem += `*Total a pagar: R$ ${saldoFormatado}*\n\n`;
        mensagem += `💳 *Chave Pix:* ${chavePix}\n`;

        if (linkCatalogo && linkCatalogo.trim() !== '') {
            mensagem += `\n📖 Já estou montando os próximos pedidos da Cacau Show! Dá uma olhada no catálogo novo no link abaixo:\n${linkCatalogo.trim()}\n`;
        }

        mensagem += `\nQualquer dúvida, estou à disposição. Obrigado! 🙌`;

        return {
            sucesso: true,
            cliente: cliente,
            mensagemTexto: mensagem,
            canal: cliente.canalPreferencial,
            linkWhatsApp: cliente.canalPreferencial === 'WHATSAPP' 
                ? `https://wa.me/${cliente.obterTelefoneLimpoWhatsApp()}?text=${encodeURIComponent(mensagem)}`
                : null
        };
    }
}