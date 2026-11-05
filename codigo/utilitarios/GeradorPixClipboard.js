/**
 * Utilitário para gerar QR Code do Pix e copiá-lo diretamente como imagem para o Clipboard.
 */
export class GeradorPixClipboard {
    /**
     * Monta o payload Pix padrão EMV (BR Code)
     */
    static gerarPayloadPix({ chavePix, nomeRecebedor = 'Cacau Gestao', cidadeRecebedor = 'Curitiba', valor = null }) {
        const formatarCampo = (id, valorTexto) => {
            const tamanho = String(valorTexto.length).padStart(2, '0');
            return `${id}${tamanho}${valorTexto}`;
        };

        const chaveTratada = chavePix.trim();
        const infoAdicional = formatarCampo('00', 'BR.GOV.BCB.PIX') + formatarCampo('01', chaveTratada);

        let payloadSemCrc = 
            formatarCampo('00', '01') +
            formatarCampo('26', infoAdicional) +
            formatarCampo('52', '0000') +
            formatarCampo('53', '986'); // Moeda BRL

        if (valor && valor > 0) {
            payloadSemCrc += formatarCampo('54', Number(valor).toFixed(2));
        }

        payloadSemCrc +=
            formatarCampo('58', 'BR') +
            formatarCampo('59', nomeRecebedor.substring(0, 25)) +
            formatarCampo('60', cidadeRecebedor.substring(0, 15)) +
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
     * Converte o payload em imagem PNG e copia diretamente para a Área de Transferência
     */
    static async copiarQrCodeParaClipboard({ chavePix, valor = null }) {
        if (!window.QRCode) {
            throw new Error("Biblioteca QRCode não carregada no navegador.");
        }

        const payload = this.gerarPayloadPix({ chavePix, valor });
        
        // Renderiza o QR Code em um canvas invisível
        const canvas = document.createElement('canvas');
        await window.QRCode.toCanvas(canvas, payload, {
            width: 320,
            margin: 2,
            color: {
                dark: '#2C1810',
                light: '#FFFFFF'
            }
        });

        // Converte o canvas para Blob PNG
        const blob = await new Promise((resolve, reject) => {
            canvas.toBlob(b => b ? resolve(b) : reject(new Error("Falha ao gerar blob do QR Code")), 'image/png');
        });

        // Grava a imagem na Área de Transferência
        if (navigator.clipboard && window.ClipboardItem) {
            const item = new ClipboardItem({ 'image/png': blob });
            await navigator.clipboard.write([item]);
            return true;
        } else {
            throw new Error("Seu navegador não suporta cópia direta de imagem para a área de transferência.");
        }
    }
}