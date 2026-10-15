/**
 * CASO DE USO: LerFolhaComIA
 * Envia a imagem da folha de vendas para a Gemini Interactions API (gemini-3.8-flash).
 */
export class LerFolhaComIA {
    /**
     * @param {string} chaveApiGemini
     */
    constructor(chaveApiGemini) {
        this.chaveApi = chaveApiGemini;
    }

    /**
     * Converte o arquivo File/Blob em Base64
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
     * Remove eventuais blocos de formatação markdown (```json ... ```)
     */
    limparJsonResposta(texto) {
        let limpo = texto.trim();
        if (limpo.startsWith('```json')) {
            limpo = limpo.replace(/^```json\s*/i, '').replace(/\s*```$/i, '');
        } else if (limpo.startsWith('```')) {
            limpo = limpo.replace(/^```\s*/i, '').replace(/\s*```$/i, '');
        }
        return limpo.trim();
    }

    /**
     * Extrai o texto da resposta da nova Interactions API com tolerância a variações
     */
    extrairTextoResposta(dados) {
        if (dados.output_text) return dados.output_text;
        
        if (dados.outputs && dados.outputs.length > 0) {
            return dados.outputs[dados.outputs.length - 1].text;
        }

        if (dados.steps) {
            for (const step of dados.steps) {
                if (step.content) {
                    for (const c of step.content) {
                        if (c.type === 'text' && c.text) return c.text;
                    }
                }
            }
        }

        // Formato legado de candidatos caso ocorra
        if (dados.candidates?.[0]?.content?.parts?.[0]?.text) {
            return dados.candidates[0].content.parts[0].text;
        }

        return null;
    }

    /**
     * Processa a foto da folha manuscrita usando o gemini-3.8-flash
     * @param {File} arquivoImagem
     */
    async processarImagemFolha(arquivoImagem) {
        if (!this.chaveApi) {
            throw new Error("Chave da API do Google Gemini não configurada.");
        }

        const imagemBase64 = await this.arquivoParaBase64(arquivoImagem);

        const promptInstrucoes = `
Você é um especialista em ler folhas manuscritas de controle de consumo corporativo de chocolates.
Analise com precisão a imagem da tabela em anexo.

As 4 colunas de chocolates são:
1. "Trufa 30g" (R$ 5.29)
2. "Tablete 20g" (R$ 5.29)
3. "Trufa 13.5g" (R$ 3.79)
4. "Tablete 5g" (R$ 1.39)

Para CADA linha manuscrita identificada na tabela:
- Extraia o "Nome Completo" e o "Setor".
- Identifique a quantidade anotada para cada chocolate (números 1, 2, 3 ou traços I, II, III).
- REGRA CRUCIAL DE PAGAMENTO:
  * Se estiver escrito "PG", "pago", "p", "(PG)" ou similar, defina pagoNaHora: true.
  * Se houver apenas número ou traço SEM menção de pago, defina pagoNaHora: false (fiado para cobrar no fim do mês).

Retorne ESTRITAMENTE um array JSON no seguinte formato (sem explicações adicionais):
[
  {
    "nomeCliente": "Nome identificado",
    "setor": "Setor",
    "nomeChocolate": "Trufa 30g",
    "quantidade": 1,
    "pagoNaHora": false
  }
]
`;

        // Endpoint oficial da Interactions API
        const url = `https://generativelanguage.googleapis.com/v1beta/interactions?key=${this.chaveApi}`;

        const corpoRequisicao = {
            model: "gemini-3.8-flash",
            store: false,
            input: [
                {
                    type: "text",
                    text: promptInstrucoes
                },
                {
                    type: "image",
                    data: imagemBase64,
                    mime_type: arquivoImagem.type || "image/jpeg"
                }
            ]
        };

        const resposta = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': this.chaveApi
            },
            body: JSON.stringify(corpoRequisicao)
        });

        if (!resposta.ok) {
            const erroJson = await resposta.json().catch(() => ({}));
            throw new Error(`Falha na Interactions API: ${erroJson.error?.message || resposta.statusText}`);
        }

        const dadosResposta = await resposta.json();
        const textoGerado = this.extrairTextoResposta(dadosResposta);

        if (!textoGerado) {
            console.error("Resposta da API:", dadosResposta);
            throw new Error("A IA não retornou texto compreensível da imagem.");
        }

        const jsonLimpo = this.limparJsonResposta(textoGerado);
        return JSON.parse(jsonLimpo);
    }
}