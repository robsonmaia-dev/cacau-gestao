/**
 * CASO DE USO: LerFolhaComIA
 * Converte a foto da folha em base64 e envia para o Google Gemini Vision extrair as vendas.
 */
export class LerFolhaComIA {
    /**
     * @param {string} chaveApiGemini
     */
    constructor(chaveApiGemini) {
        this.chaveApi = chaveApiGemini;
    }

    /**
     * Converte um arquivo File/Blob em Base64
     */
    async arquivoParaBase64(arquivo) {
        return new Promise((resolve, reject) => {
            const leitor = new FileReader();
            leitor.onload = () => {
                const base64 = leitor.result.split(',')[1];
                resolve(base64);
            };
            leitor.onerror = erro => reject(erro);
            leitor.readAsDataURL(arquivo);
        });
    }

    /**
     * Processa a imagem da folha e retorna a lista de vendas estruturada
     * @param {File} arquivoImagem
     */
    async processarImagemFolha(arquivoImagem) {
        if (!this.chaveApi) {
            throw new Error("Chave da API do Google Gemini não configurada.");
        }

        const imagemBase64 = await this.arquivoParaBase64(arquivoImagem);

        const prompt = `
Você é um especialista em ler folhas manuscritas de controle de consumo de chocolates.
Analise a imagem da tabela anexa.

A tabela contém as seguintes colunas de chocolates:
1. "Trufa 30g" (R$ 5.29)
2. "Tablete 20g" (R$ 5.29)
3. "Trufa 13.5g" (R$ 3.79)
4. "Tablete 5g" (R$ 1.39)

Para CADA linha preenchida com o nome de uma pessoa:
- Identifique o "Nome Completo" e o "Setor".
- Identifique a quantidade anotada em cada coluna de chocolate (números 1, 2, 3 ou traços romanos I, II, III).
- REGRA CRUCIAL DE PAGAMENTO:
  * Se estiver escrito "PG", "pago", "p", "(PG)" junto da quantidade, o campo pagoNaHora DEVE ser true.
  * Se houver apenas o número ou traço SEM indicação de pago, o campo pagoNaHora DEVE ser false (é fiado a cobrar).

Retorne ESTRITAMENTE um JSON no formato (sem blocos de markdown adicionais além do json):
[
  {
    "nomeCliente": "Nome da pessoa",
    "setor": "Setor anotado",
    "nomeChocolate": "Nome exato da coluna (ex: Trufa 30g, Tablete 20g, Trufa 13.5g ou Tablete 5g)",
    "quantidade": 1,
    "pagoNaHora": false
  }
]
`;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.chaveApi}`;

        const resposta = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: prompt },
                        {
                            inline_data: {
                                mime_type: arquivoImagem.type || "image/jpeg",
                                data: imagemBase64
                            }
                        }
                    ]
                }],
                generationConfig: {
                    temperature: 0.1, // Baixa temperatura para precisão máxima
                    response_mime_type: "application/json"
                }
            })
        });

        if (!resposta.ok) {
            const erroJson = await resposta.json();
            throw new Error(`Falha na IA do Gemini: ${erroJson.error?.message || resposta.statusText}`);
        }

        const dadosResposta = await resposta.json();
        const textoGerado = dadosResposta.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!textoGerado) {
            throw new Error("A IA não conseguiu interpretar o texto da imagem.");
        }

        try {
            return JSON.parse(textoGerado);
        } catch (e) {
            console.error("Texto retornado:", textoGerado);
            throw new Error("Erro ao converter resposta da IA em dados válidos.");
        }
    }
}