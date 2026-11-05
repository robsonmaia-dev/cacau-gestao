/**
 * Utilitário para gerar QR Code do Pix e copiá-lo como imagem PNG para a Área de Transferência.
 */
export class GeradorPixClipboard {
    static gerarPayloadPix({ chavePix, nomeRecebedor = 'Cacau Gestao', cidadeRecebedor = 'Curitiba', valor = null }) {
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
            formatarCampo('53', '986');

        if (valor && Number(valor) > 0) {
            payloadSemCrc += formatarCampo('54', Number(valor).toFixed(2));
        }

        payloadSemCrc +=
            formatarCampo('58', 'BR') +
            formatarCampo('59', nomeLimpo) +
            formatarCampo('60', cidadeLimpa) +
            formatarCampo('62', formatarCampo('05', '***')) +
            '6304';

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

    static async copiarQrCodeParaClipboard({ chavePix, valor = null }) {
        if (!window.QRCode) {
            throw new Error("A biblioteca QRCode ainda não foi carregada.");
        }

        if (!navigator.clipboard || !window.ClipboardItem) {
            throw new Error("Seu navegador não suporta cópia direta de imagens para a área de transferência.");
        }

        const payload = this.gerarPayloadPix({ chavePix, valor });
        const canvas = document.createElement('canvas');

        await new Promise((resolve, reject) => {
            window.QRCode.toCanvas(
                canvas,
                payload,
                {
                    width: 320,
                    margin: 2,
                    color: {
                        dark: '#2C1810',
                        light: '#FFFFFF'
                    }
                },
                (erro) => (erro ? reject(erro) : resolve())
            );
        });

        const blob = await new Promise((resolve, reject) => {
            canvas.toBlob(
                (b) => (b ? resolve(b) : reject(new Error("Falha ao converter o QR Code para imagem."))),
                'image/png'
            );
        });

        await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
        ]);

        return true;
    }
}