/**
 * Utilitário para gerar o código Pix padrão do Banco Central (BR Code)
 * e copiar a mensagem com o QR Code embutido para a Área de Transferência.
 */
export class GeradorPixClipboard {
    /**
     * Gera o código Pix Copia e Cola oficial com valor
     */
    static gerarPayloadPix({ chavePix, valor = null, nomeRecebedor = 'Cacau Gestao', cidadeRecebedor = 'Curitiba' }) {
        const formatarCampo = (id, valorTexto) => {
            const tamanho = String(valorTexto.length).padStart(2, '0');
            return `${id}${tamanho}${valorTexto}`;
        };

        const limparAscii = (texto) => (texto || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-zA-Z0-9 ]/g, '')
            .trim();

        const chaveTratada = chavePix.trim();
        const nomeLimpo = limparAscii(nomeRecebedor).substring(0, 25) || 'Cacau Gestao';
        const cidadeLimpa = limparAscii(cidadeRecebedor).substring(0, 15) || 'Curitiba';

        const infoAdicional = formatarCampo('00', 'BR.GOV.BCB.PIX') + formatarCampo('01', chaveTratada);

        let payloadSemCrc =
            formatarCampo('00', '01') +
            formatarCampo('26', infoAdicional) +
            formatarCampo('52', '0000') +
            formatarCampo('53', '986'); // Moeda BRL

        if (valor && Number(valor) > 0) {
            payloadSemCrc += formatarCampo('54', Number(valor).toFixed(2));
        }

        payloadSemCrc +=
            formatarCampo('58', 'BR') +
            formatarCampo('59', nomeLimpo) +
            formatarCampo('60', cidadeLimpa) +
            formatarCampo('62', formatarCampo('05', '***')) +
            '6304';

        // Cálculo CRC16-CCITT
        let crc = 0xFFFF;
        for (let i = 0; i < payloadSemCrc.length; i++) {
            crc ^= (payloadSemCrc.charCodeAt(i) << 8);
            for (let j = 0; j < 8; j++) {
                if ((crc & 0x8000) !== 0) {
                    crc = ((crc << 1) ^ 0x1021) & 0xFFFF;
                } else {
                    crc = (crc << 1) & 0xFFFF;
                }
            }
        }

        const crcHex = (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
        return payloadSemCrc + crcHex;
    }

    /**
     * Gera a imagem do QR Code em Base64 (DataURL)
     */
    static async gerarQrCodeDataUrl(payload) {
        if (!window.QRCode) {
            throw new Error("Biblioteca QRCode não carregada.");
        }

        return new Promise((resolve, reject) => {
            window.QRCode.toDataURL(
                payload,
                {
                    width: 240,
                    margin: 2,
                    color: {
                        dark: '#2C1810',
                        light: '#FFFFFF'
                    }
                },
                (erro, url) => (erro ? reject(erro) : resolve(url))
            );
        });
    }

    /**
     * Copia texto plano E rich text HTML com a imagem do QR Code ao mesmo tempo
     */
    static async copiarMensagemComQrCode({ textoPlano, textoHtml }) {
        if (!navigator.clipboard || !window.ClipboardItem) {
            // Fallback para navegadores sem suporte a ClipboardItem
            await navigator.clipboard.writeText(textoPlano);
            return;
        }

        const blobTexto = new Blob([textoPlano], { type: 'text/plain' });
        const blobHtml = new Blob([textoHtml], { type: 'text/html' });

        await navigator.clipboard.write([
            new ClipboardItem({
                'text/plain': blobTexto,
                'text/html': blobHtml
            })
        ]);
    }
}