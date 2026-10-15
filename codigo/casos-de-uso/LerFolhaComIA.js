/**
 * CASO DE USO: LerFolhaComIA
 * Converte a foto da folha em base64 e envia para o Google Gemini Flash (3.8) extrair as vendas.
 */
export class LerFolhaComIA {
    /**
     * @param {string} chaveApiGemini
     */
    constructor(chaveApiGemini) {
        this.chaveApi = chaveApiGemini;
        // Modelos em ordem de prioridade (Gemini 3.8 Flash como principal)
        this.modelosDisponiveis = [
            'gemini-3.8-flash',
            'gemini-2.5-flash',
            'gemini-2.0-flash'
        ];
    }

    /**
     * Converte o arquivo de imagem em Base64
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
     * Limpa eventuais marcações de markdown (```json ... ```) devolvidas pelo modelo
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
     * Processa a imagem da folha com tentativa sequencial dos modelos
     * @param {File} arquivoImagem
     */
    async processarImagemFolha(arquivoImagem) {
        if (!this.chaveApi) {
            throw new Error("Chave da API do Google Gemini não configurada.");
        }

        const imagemBase64 = await this.arquivoParaBase64(arquivoImagem);

        const promptInstrucoes = `
Você é um especialista em ler folhas manuscritas de controle de consumo de chocolates corporativo.
Analise com extrema atenção a tabela manuscrita anexada.

A tabela contém 4 colunas de produtos:
1. "Trufa 30g" (R$ 5.29)
2. "Tablete 20g" (R$ 5.29)
3. "Trufa 13.5g" (R$ 3.79)
4. "Tablete 5g" (R$ 1.39)

Para CADA linha preenchida com o nome legível de uma pessoa:
- Identifique o "Nome Completo" e o "Setor".
- Identifique a quantidade anotada em cada coluna (números como 1, 2, 3 ou traços romanos I, II, III).
- REGRA CRUCIAL DE PAGAMENTO:
  * Se estiver escrito "PG", "pago", "p", "(PG)" ou similar junto da quantidade, marque pagoNaHora: true.
  * Se houver apenas o número/quantidade SEM menção de pago, marque pagoNaHora: false (fiado para cobrar no fim do mês).

Retorne ESTRITAMENTE um array JSON:
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

        let ultimoErro = null;

        // Tenta com gemini-3.8-flash; se o endpoint falhar, tenta os irmãos 2.5 / 2.0 automaticamente
        for (const modelo of this.modelosDisponiveis) {
            try {
                const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${this.chaveApi}`;

                const resposta = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [
                                { text: promptInstrucoes },
                                {
                                    inlineData: {
                                        mimeType: arquivoImagem.type || "image/jpeg",
                                        data: imagemBase64
                                    }
                                }
                            ]
                        }],
                        generationConfig: {
                            temperature: 0.1,
                            responseMimeType: "application/json"
                        }
                    })
                });

                if (!resposta.ok) {
                    const erroJson = await resposta.json().catch(() => ({}));
                    throw new Error(`[Modelo ${modelo}] ${erroJson.error?.message || resposta.statusText}`);
                }

                const dados = await resposta.json();
                const textoGerado = dados.candidates?.[0]?.content?.parts?.[0]?.text;

                if (!textoGerado) {
                    throw new Error(`Modelo ${modelo} não retornou conteúdo legível.`);
                }

                const jsonLimpo = this.limparJsonResposta(textoGerado);
                return JSON.parse(jsonLimpo);

            } catch (err) {
                console.warn(`Tentativa com ${modelo} falhou:`, err.message);
                ultimoErro = err;
                // Continua para o próximo modelo do loop
            }
        }

        throw new Error(`Falha na IA: ${ultimoErro?.message || 'Nenhum modelo respondeu com sucesso.'}`);
    }
}