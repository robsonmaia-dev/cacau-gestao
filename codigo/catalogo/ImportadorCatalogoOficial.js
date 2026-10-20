/**
 * IMPORTADOR DE CATÁLOGO OFICIAL (CACAU SHOW)
 * Converte o catálogo digital oficial em páginas com marcações de produtos (hotspots).
 */
export class ImportadorCatalogoOficial {
    static URL_PADRAO = "https://catalogo.cacaushow.com.br/2026/catalogo/ciclo-13-e-14/catalogo-vd-ciclos-13-e-14/?page=2";

    /**
     * Importa as páginas e os hotspots de produtos a partir da URL do catálogo
     */
    static async importarDeUrl(urlCatalogo = this.URL_PADRAO) {
        // Usa proxy transparente para contornar restrições de CORS no navegador
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(urlCatalogo)}`;
        
        const resposta = await fetch(proxyUrl);
        if (!resposta.ok) {
            throw new Error(`Não foi possível acessar o catálogo oficial (Status: ${resposta.status})`);
        }

        const html = await resposta.text();
        const match = html.match(/window\.staticSettings\s*=\s*(\{.+?\});/s);
        if (!match) {
            throw new Error("Estrutura de dados do catálogo não encontrada na página.");
        }

        const configuracoes = JSON.parse(match[1]);
        const awsUrl = configuracoes.aws?.url || "";
        const policy = configuracoes.aws?.policy || "";
        const totalPaginas = configuracoes.pages?.length || 0;
        const chunks = configuracoes.enrichments?.chunkUrls || {};

        const produtosPorPagina = {};
        for (let i = 1; i <= totalPaginas; i++) {
            produtosPorPagina[i] = [];
        }

        // Puxa os lotes de produtos e coordenadas (hotspots)
        for (const [chave, chunkUrl] of Object.entries(chunks)) {
            try {
                const chunkProxy = `https://api.allorigins.win/raw?url=${encodeURIComponent(chunkUrl)}`;
                const chunkResp = await fetch(chunkProxy);
                if (chunkResp.ok) {
                    const dadosChunk = await chunkResp.json();
                    const enrichments = dadosChunk.enrichments || [];

                    for (const item of enrichments) {
                        const nome = item.name || item.alttext || "";
                        const preco = Number(item.price) || 0;
                        const pagina = item.pageIndex !== undefined ? item.pageIndex + 1 : (item.pagenumber || 1);

                        if (nome && preco > 0 && produtosPorPagina[pagina]) {
                            produtosPorPagina[pagina].push({
                                id: String(item.productId || item.id || Math.random()),
                                nome: nome.trim(),
                                preco: Number(preco.toFixed(2)),
                                x: (item.x || 0) * 100,
                                y: (item.y || 0) * 100,
                                w: (item.width || 0.1) * 100,
                                h: (item.height || 0.08) * 100,
                                esgotado: false
                            });
                        }
                    }
                }
            } catch (e) {
                console.warn(`Lote ${chave} indisponível:`, e);
            }
        }

        // Monta o array final de páginas com fotos
        const paginasMapeadas = [];
        for (let p = 1; p <= totalPaginas; p++) {
            const produtos = produtosPorPagina[p] || [];
            paginasMapeadas.push({
                numero: p,
                imagem: `${awsUrl}Pages/${p}/Normal.jpg?${policy}`,
                qtd_produtos: produtos.length,
                produtos: produtos,
                ativa: true // Habilitada por padrão
            });
        }

        return {
            totalPaginas,
            paginas: paginasMapeadas
        };
    }
}