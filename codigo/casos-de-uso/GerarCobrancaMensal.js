export class GerarCobrancaMensal {
    constructor(repositorioVendas) {
        this.repositorioVendas = repositorioVendas;
    }

    async executar({ cliente, chavePix, linkCatalogo = '' }) {
        if (!cliente) throw new Error("Cliente não informado para cobrança.");
        if (!chavePix) throw new Error("Chave Pix não configurada.");

        const todasVendas = await this.repositorioVendas.obterTodas();
        const vendasCliente = todasVendas.filter(v => v.clienteId === cliente.id && v.ehFiado());

        const mapaItensConsumidos = new Map();
        let subtotalConsumido = 0;

        vendasCliente.forEach(venda => {
            venda.itens.forEach(item => {
                const atual = mapaItensConsumidos.get(item.nomeProduto) || { quantidade: 0, total: 0 };
                const valorItem = item.quantidade * item.precoVendaUnitario;
                subtotalConsumido += valorItem;

                mapaItensConsumidos.set(item.nomeProduto, {
                    quantidade: atual.quantidade + item.quantidade,
                    total: atual.total + valorItem
                });
            });
        });

        let linhasExtrato = "";
        if (mapaItensConsumidos.size > 0) {
            mapaItensConsumidos.forEach((info, nomeProduto) => {
                linhasExtrato += `• ${info.quantidade}x ${nomeProduto} (R$ ${info.total.toFixed(2)})\n`;
            });
        } else {
            linhasExtrato = `• Saldo pendente acumulado anterior\n`;
        }

        const saldoFormatado = cliente.saldoDevedor.toFixed(2);
        const totalPagamentos = (cliente.historicoPagamentos || []).reduce((soma, p) => soma + p.valor, 0);

        let mensagem = `Olá, ${cliente.nome}! Tudo bem? 😊🍫\n\n`;
        mensagem += `Segue o fechamento dos seus chocolates deste mês:\n\n`;
        mensagem += `${linhasExtrato}\n`;

        if (totalPagamentos > 0) {
            mensagem += `Subtotal consumido: R$ ${subtotalConsumido.toFixed(2)}\n`;
            mensagem += `(-) Pagamentos já realizados: R$ ${totalPagamentos.toFixed(2)}\n`;
        }

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
