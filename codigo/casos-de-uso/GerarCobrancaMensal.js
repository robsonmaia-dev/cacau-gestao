import { GeradorPixClipboard } from '../utilitarios/GeradorPixClipboard.js';

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
        let linhasExtratoHtml = "";

        if (mapaItensConsumidos.size > 0) {
            mapaItensConsumidos.forEach((info, nomeProduto) => {
                linhasExtrato += `• ${info.quantidade}x ${nomeProduto} (R$ ${info.total.toFixed(2)})\n`;
                linhasExtratoHtml += `<li><strong>${info.quantidade}x</strong> ${nomeProduto} — R$ ${info.total.toFixed(2)}</li>`;
            });
            linhasExtratoHtml = `<ul style="margin: 8px 0; padding-left: 20px;">${linhasExtratoHtml}</ul>`;
        } else {
            linhasExtrato = `• Saldo pendente acumulado anterior\n`;
            linhasExtratoHtml = `<p>• Saldo pendente acumulado anterior</p>`;
        }

        const saldoFormatado = Number(cliente.saldoDevedor || 0).toFixed(2);
        const totalPagamentos = (cliente.historicoPagamentos || []).reduce((soma, p) => soma + p.valor, 0);

        // Apenas o primeiro nome
        const primeiroNome = (cliente.nome || '').trim().split(/\s+/)[0] || 'Colega';

        // Gera o código Pix Copia e Cola com o valor exato da fatura
        const payloadPix = GeradorPixClipboard.gerarPayloadPix({
            chavePix: chavePix,
            valor: Number(saldoFormatado)
        });

        // 1. Mensagem em Texto Puro (WhatsApp e apps legados)
        let mensagemTexto = `Olá, ${primeiroNome}! Tudo bem? 😊🍫\n\n`;
        mensagemTexto += `Segue o fechamento dos seus chocolates deste mês:\n\n`;
        mensagemTexto += `${linhasExtrato}\n`;

        if (totalPagamentos > 0) {
            mensagemTexto += `Subtotal consumido: R$ ${subtotalConsumido.toFixed(2)}\n`;
            mensagemTexto += `(-) Pagamentos já realizados: R$ ${totalPagamentos.toFixed(2)}\n`;
        }

        mensagemTexto += `*Total a pagar: R$ ${saldoFormatado}*\n\n`;
        mensagemTexto += `💳 *Chave Pix:* ${chavePix}\n\n`;
        mensagemTexto += `📱 *Pix Copia e Cola:*\n${payloadPix}\n`;

        if (linkCatalogo && linkCatalogo.trim() !== '') {
            mensagemTexto += `\n📖 Já estou montando os próximos pedidos da Cacau Show! Catálogo novo no link:\n${linkCatalogo.trim()}\n`;
        }

        mensagemTexto += `\nQualquer dúvida, estou à disposição. Obrigado! 🙌`;

        return {
            sucesso: true,
            cliente: cliente,
            primeiroNome: primeiroNome,
            valorPendente: Number(saldoFormatado),
            payloadPix: payloadPix,
            linhasExtratoHtml: linhasExtratoHtml,
            subtotalConsumido: subtotalConsumido,
            totalPagamentos: totalPagamentos,
            mensagemTexto: mensagemTexto,
            canal: cliente.canalPreferencial,
            linkWhatsApp: cliente.canalPreferencial === 'WHATSAPP'
                ? `https://wa.me/${cliente.obterTelefoneLimpoWhatsApp()}?text=${encodeURIComponent(mensagemTexto)}`
                : null
        };
    }
}