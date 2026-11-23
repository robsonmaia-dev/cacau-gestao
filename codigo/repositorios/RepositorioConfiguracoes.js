import { RepositorioBase } from './RepositorioBase.js';

export class RepositorioConfiguracoes extends RepositorioBase {
    constructor() {
        super('configuracoes');
        this.idPadrao = 'principal';
    }

    async obter() {
        const cachePix = localStorage.getItem('cacau_chave_pix') || '';
        const cacheCatalogo = localStorage.getItem('cacau_link_catalogo') || '';
        const cacheFonte = localStorage.getItem('cacau_url_fonte_catalogo') || '';

        try {
            const { data, error } = await this.cliente
                .from(this.nomeTabela)
                .select('*')
                .eq('id', this.idPadrao)
                .maybeSingle();

            if (!error && data) {
                const chavePix = data.chave_pix ?? cachePix;
                const linkCatalogo = data.link_catalogo ?? cacheCatalogo;
                const urlFonteCatalogo = data.url_fonte_catalogo ?? cacheFonte;

                if (chavePix) localStorage.setItem('cacau_chave_pix', chavePix);
                if (linkCatalogo) localStorage.setItem('cacau_link_catalogo', linkCatalogo);
                if (urlFonteCatalogo) localStorage.setItem('cacau_url_fonte_catalogo', urlFonteCatalogo);

                return { chavePix, linkCatalogo, urlFonteCatalogo };
            }
        } catch (erro) {
            console.warn("Aviso ao buscar configurações na nuvem (usando cache local):", erro);
        }

        return { chavePix: cachePix, linkCatalogo: cacheCatalogo, urlFonteCatalogo: cacheFonte };
    }

    async salvarConfiguracoes({ chavePix, linkCatalogo, urlFonteCatalogo }) {
        const dadosAtuais = await this.obter().catch(() => ({
            chavePix: localStorage.getItem('cacau_chave_pix') || '',
            linkCatalogo: localStorage.getItem('cacau_link_catalogo') || '',
            urlFonteCatalogo: localStorage.getItem('cacau_url_fonte_catalogo') || ''
        }));

        const pixFinal = chavePix !== undefined ? String(chavePix).trim() : dadosAtuais.chavePix;
        const catalogoFinal = linkCatalogo !== undefined ? String(linkCatalogo).trim() : dadosAtuais.linkCatalogo;
        const fonteFinal = urlFonteCatalogo !== undefined ? String(urlFonteCatalogo).trim() : dadosAtuais.urlFonteCatalogo;

        localStorage.setItem('cacau_chave_pix', pixFinal);
        localStorage.setItem('cacau_link_catalogo', catalogoFinal);
        localStorage.setItem('cacau_url_fonte_catalogo', fonteFinal);

        try {
            const payload = {
                id: this.idPadrao,
                chave_pix: pixFinal,
                link_catalogo: catalogoFinal,
                url_fonte_catalogo: fonteFinal,
                atualizado_em: new Date().toISOString()
            };

            const { error } = await this.cliente.from(this.nomeTabela).upsert(payload);

            // Caso a coluna url_fonte_catalogo ainda não tenha sido criada no Supabase, salva ao menos os outros campos
            if (error && String(error.message || '').includes('url_fonte_catalogo')) {
                await this.cliente.from(this.nomeTabela).upsert({
                    id: this.idPadrao,
                    chave_pix: pixFinal,
                    link_catalogo: catalogoFinal,
                    atualizado_em: new Date().toISOString()
                });
            } else if (error) {
                console.warn("Aviso ao salvar configurações no Supabase:", error.message);
            }
        } catch (erro) {
            console.warn("Falha ao sincronizar configurações com o Supabase:", erro);
        }

        return { chavePix: pixFinal, linkCatalogo: catalogoFinal, urlFonteCatalogo: fonteFinal };
    }
}
