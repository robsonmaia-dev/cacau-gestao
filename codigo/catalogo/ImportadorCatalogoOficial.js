/**
 * IMPORTADOR DE CATÁLOGO OFICIAL (CACAU SHOW)
 * Converte o catálogo digital oficial em páginas com marcações únicas (sem '+' duplicados).
 */
export class ImportadorCatalogoOficial {
    static URL_PADRAO = "https://catalogo.cacaushow.com.br/2026/catalogo/ciclo-13-e-14/catalogo-vd-ciclos-13-e-14/?page=2";

    static async buscarTextoComFallbackProxy(urlAlvo) {
        const proxies = [
            `https://api.allorigins.win/raw?url=${encodeURIComponent(urlAlvo)}`,
            `https://corsproxy.io/?url=${encodeURIComponent(urlAlvo)}`
        ];

        let ultimoErro = null;
        for (const proxyUrl of proxies) {
            try {
                const resp = await fetch(proxyUrl);
                if (resp.ok) {
                    return await resp.text();
                }
                ultimoErro = new Error(`Status ${resp.status}`);
            } catch (err) {
                ultimoErro = err;
            }
        }
        throw ultimoErro || new Error("Não foi possível acessar a URL informada.");
    }

    static deduplicarProdutosPagina(produtos, numeroPagina) {
        const agrupados = new Map();

        for (const prod of (produtos || [])) {
            const idStr = String(prod.id || '').trim();
            const nomeNorm = String(prod.nome || '').trim().toLowerCase().replace(/\s+/g, ' ');
            const chave = `${idStr}::${nomeNorm}`;
            const area = Number(prod.w || 0) * Number(prod.h || 0);

            if (!agrupados.has(chave)) {
                agrupados.set(chave, { area, prod: { ...prod } });
            } else {
                const atual = agrupados.get(chave);
                if (area > atual.area) {
                    agrupados.set(chave, { area, prod: { ...prod } });
                }
            }
        }

        const lista = [];
        let idx = 0;
        for (const { prod } of agrupados.values()) {
            lista.push({
                ...prod,
                uid: `p${numeroPagina}-${prod.id}-${idx++}`
            });
        }
        return lista;
    }

    /**
     * Importa as páginas e os hotspots de produtos a partir da URL do catálogo
     */
    static async importarDeUrl(urlCatalogo = this.URL_PADRAO) {
        const urlLimpa = (urlCatalogo || '').trim() || this.URL_PADRAO;
        const html = await this.buscarTextoComFallbackProxy(urlLimpa);

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

        for (const [chave, chunkUrl] of Object.entries(chunks)) {
            try {
                const textoChunk = await this.buscarTextoComFallbackProxy(chunkUrl);
                const dadosChunk = JSON.parse(textoChunk);
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
            } catch (e) {
                console.warn(`Lote ${chave} indisponível:`, e);
            }
        }

        const paginasMapeadas = [];
        for (let p = 1; p <= totalPaginas; p++) {
            const produtosLimpos = this.deduplicarProdutosPagina(produtosPorPagina[p] || [], p);
            paginasMapeadas.push({
                numero: p,
                imagem: `${awsUrl}Pages/${p}/Normal.jpg?${policy}`,
                qtd_produtos: produtosLimpos.length,
                produtos: produtosLimpos,
                ativa: true
            });
        }

        return {
            totalPaginas,
            paginas: paginasMapeadas
        };
    }
}
